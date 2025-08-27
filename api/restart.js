// pages/api/restart.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const RENDER_API_KEY = process.env.RENDER_API_KEY;
  const SERVICE_ID = process.env.RENDER_SERVICE_ID;
  const FURNITURE_API_BASE_URL = process.env.FURNITURE_API_BASE_URL;
  const GLOBAL_ADMIN_SECRET = process.env.GLOBAL_ADMIN_SECRET;

  if (!RENDER_API_KEY || !SERVICE_ID || !FURNITURE_API_BASE_URL || !GLOBAL_ADMIN_SECRET) {
    return res.status(500).json({ error: "Server misconfigured: missing env vars" });
  }

  try {
    // 1) Resume backend service on Render
    const response = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/resume`, {
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

    // 2) Reset global logout flag in Furniture backend
    try {
      const resetRes = await fetch(`${FURNITURE_API_BASE_URL}/api/admin/global-logout/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": GLOBAL_ADMIN_SECRET
        }
      });

      if (!resetRes.ok) {
        const text = await resetRes.text();
        console.error("Reset API failed:", text);
      } else {
        const data = await resetRes.json();
        console.log("Reset response:", data);
      }
    } catch (err) {
      console.error("Failed to reset global logout flag:", err);
    }

    // 3) Return success
    return res.json({
      success: true,
      message: "✅ Service resumed (restarted) and logout flag reset"
    });

  } catch (err) {
    console.error("Restart error:", err);
    return res.status(500).json({ error: err.message });
  }
}
