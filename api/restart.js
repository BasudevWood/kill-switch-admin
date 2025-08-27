// kill-switch-admin/api/restart.js
import fetch from "node-fetch";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { RENDER_API_KEY, FURNITURE_API_BASE_URL } = process.env;
  const SERVICE_ID =
    process.env.RENDER_BACKEND_SERVICE_ID ||
    process.env.RENDER_SERVICE_ID ||
    process.env.SERVICE_ID;

  if (!RENDER_API_KEY || !SERVICE_ID || !FURNITURE_API_BASE_URL) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  try {
    // 1) Ask Render to resume the backend
    const response = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/resume`, {
      method: "POST",
      headers: { Authorization: `Bearer ${RENDER_API_KEY}`, Accept: "application/json" },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "Render API error: " + text });
    }

    // 2) Poll the backend root `/` until it's alive.
    //    When `/` responds OK for the first time, the backend will reset forceLogout=false.
    const maxTries = 12;         // ~ up to 2 minutes total (12 * 10s)
    const delayMs = 10000;       // 10s between tries
    let alive = false;
    let lastStatus = null;
    let lastErr = null;

    for (let i = 0; i < maxTries; i++) {
      try {
        const ping = await fetch(`${FURNITURE_API_BASE_URL}/`, {
          method: "GET",
          headers: { Accept: "text/plain,application/json" },
        });
        lastStatus = ping.status;

        if (ping.ok) {
          alive = true;
          break; // ✅ Backend is up; `/` has reset forceLogout=false
        }
      } catch (e) {
        lastErr = e;
        // ignore and retry
      }

      await sleep(delayMs);
    }

    if (!alive) {
      return res.status(500).json({
        error: "Backend did not come alive in time.",
        detail: { lastStatus, lastErr: lastErr?.message },
      });
    }

    // 3) (Optional) Confirm forceLogout is now false
    try {
      const statusRes = await fetch(`${FURNITURE_API_BASE_URL}/api/admin/global-logout/status`, {
        headers: { Accept: "application/json" },
      });
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        if (statusJson?.forceLogout === false) {
          return res.json({
            success: true,
            message: "✅ Backend resumed and forceLogout reset to false.",
          });
        }
      }
      // If we couldn't confirm, still return success since hitting `/` already triggers reset.
      return res.json({
        success: true,
        message:
          "✅ Backend resumed. Attempted to verify forceLogout; if clients still see 'true', they will clear on next poll.",
      });
    } catch {
      return res.json({
        success: true,
        message:
          "✅ Backend resumed. Could not verify status, but `/` was hit so forceLogout should be reset.",
      });
    }
  } catch (err) {
    console.error("Restart error:", err);
    return res.status(500).json({ error: err.message });
  }
}
