// api/restart.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { RENDER_API_KEY, RENDER_SERVICE_ID, FURNITURE_API_BASE_URL, GLOBAL_ADMIN_SECRET } = process.env;

  if (!RENDER_API_KEY || !RENDER_SERVICE_ID) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  try {
    // 1) Resume backend service on Render
    const response = await fetch(`https://api.render.com/v1/services/${RENDER_SERVICE_ID}/resume`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RENDER_API_KEY}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "Render API error: " + text });
    }

    // 2) Reset forceLogout = false in Furniture backend
    const resetRes = await fetch(`${FURNITURE_API_BASE_URL}/api/admin/allow-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": GLOBAL_ADMIN_SECRET
      }
    });

    const resetData = await resetRes.json();
    if (!resetRes.ok) {
      return res.status(500).json({ error: "Allow-login failed", details: resetData });
    }

    return res.json({
      success: true,
      message: "✅ Service restarted & logins allowed",
      resetData
    });
  } catch (err) {
    console.error("Restart error:", err);
    return res.status(500).json({ error: err.message });
  }
}
