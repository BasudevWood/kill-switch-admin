// kill-switch-admin/api/restart.js
import fetch from "node-fetch";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { RENDER_API_KEY, FURNITURE_API_BASE_URL, GLOBAL_ADMIN_SECRET } = process.env;
  const SERVICE_ID =
    process.env.RENDER_BACKEND_SERVICE_ID ||
    process.env.RENDER_SERVICE_ID ||
    process.env.SERVICE_ID;

  if (!RENDER_API_KEY || !SERVICE_ID || !FURNITURE_API_BASE_URL || !GLOBAL_ADMIN_SECRET) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  try {
    // 1) Resume Render backend service
    const response = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/resume`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${RENDER_API_KEY}`, "Accept": "application/json" }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "Render API error: " + text });
    }

    // 2) Wait / poll until backend root is reachable
    const maxTries = 18;      // up to ~3 minutes (tweak as needed)
    const delayMs = 10000;    // 10s between tries
    let alive = false;
    let lastErr = null;

    for (let i = 0; i < maxTries; i++) {
      try {
        const ping = await fetch(`${FURNITURE_API_BASE_URL}/`, { method: "GET" });
        if (ping.ok) {
          alive = true;
          break;
        }
      } catch (err) {
        lastErr = err;
      }
      await sleep(delayMs);
    }

    if (!alive) {
      return res.status(500).json({ error: "Backend did not become reachable in time", detail: lastErr?.message });
    }

    // 3) Call admin resume endpoint to reset forceLogout = false
   const resumeRes = await fetch(`${FURNITURE_API_BASE_URL}/api/admin/resume`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-admin-secret": GLOBAL_ADMIN_SECRET,
    "Accept": "application/json"
  },
  body: JSON.stringify({})   // Express expects a body
});

    if (!resumeRes.ok) {
      const text = await resumeRes.text();
      console.warn("Resume endpoint returned non-ok:", resumeRes.status, text.slice(0,200));
      // still return success, because backend is up — but warn the admin.
      return res.json({ success: true, message: "Backend resumed but resume endpoint returned non-ok. Check logs." });
    }

    return res.json({ success: true, message: "✅ Backend resumed and forceLogout reset to false." });
  } catch (err) {
    console.error("Restart error:", err);
    return res.status(500).json({ error: err.message });
  }
}
