// kill-switch-admin/api/logout.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    RENDER_API_KEY,
    FURNITURE_API_BASE_URL,
    GLOBAL_ADMIN_SECRET
  } = process.env;

  // accept existing SERVICE_ID env var name or an explicit RENDER_BACKEND_SERVICE_ID
  const SERVICE_ID = process.env.RENDER_BACKEND_SERVICE_ID || process.env.SERVICE_ID;

  if (!RENDER_API_KEY || !SERVICE_ID || !FURNITURE_API_BASE_URL || !GLOBAL_ADMIN_SECRET) {
    return res.status(500).json({
      error:
        "Missing env vars. Make sure RENDER_API_KEY, SERVICE_ID (or RENDER_BACKEND_SERVICE_ID), FURNITURE_API_BASE_URL, and GLOBAL_ADMIN_SECRET are set in Vercel."
    });
  }

  try {
    // 1) Tell furniture backend to set forceLogout
    const backendRes = await fetch(`${FURNITURE_API_BASE_URL}/api/admin/global-logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": GLOBAL_ADMIN_SECRET
      },
      body: JSON.stringify({ message: "Forced logout via kill-switch-admin" })
    });

    const backendData = await backendRes.json();
    if (!backendRes.ok) {
      return res.status(500).json({ error: "Furniture backend error", details: backendData });
    }

    // 2) Suspend backend service on Render (optional but matches your existing kill logic)
    const renderRes = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/suspend`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RENDER_API_KEY}`,
        "Accept": "application/json"
      }
    });

    if (!renderRes.ok) {
      const text = await renderRes.text();
      return res.status(500).json({ error: "Render suspend error", details: text, backendData });
    }

   return res.json({
  success: true,
  message: "✅ All clients logged out and backend suspended",
  backendData
});

  } catch (err) {
    console.error('logout api error', err);
    return res.status(500).json({ error: err.message });
  }
}
