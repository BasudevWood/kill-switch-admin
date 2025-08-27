// kill-switch-admin/api/logout.js
import fetch from "node-fetch";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
    // 1) Set the flag first
    const backendRes = await fetch(`${FURNITURE_API_BASE_URL}/api/admin/global-logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": GLOBAL_ADMIN_SECRET,
        "Accept": "application/json"
      },
      body: JSON.stringify({ message: "Forced logout via kill-switch-admin" })
    });

    // Don't .json() if response isn't ok (suspended server may return HTML)
    if (!backendRes.ok) {
      const text = await backendRes.text().catch(() => "");
      // Proceed anyway; goal is to suspend even if backend already down
      console.warn("Backend force-logout returned non-OK:", backendRes.status, text.slice(0, 200));
    }

    // 2) Give clients a short window to poll and react
    await sleep(6000); // 6 seconds is usually enough; tweak if needed

    // 3) Suspend backend on Render
    const renderRes = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/suspend`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${RENDER_API_KEY}`, "Accept": "application/json" }
    });

    if (!renderRes.ok) {
      const text = await renderRes.text();
      return res.status(500).json({ error: "Render suspend error", details: text });
    }

    return res.json({ success: true, message: "✅ Logout triggered & backend suspended" });
  } catch (err) {
    console.error("logout api error", err);
    return res.status(500).json({ error: err.message });
  }
}
