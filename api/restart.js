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

  if (!RENDER_API_KEY || !SERVICE_ID) {
    return res.status(500).json({ error: "Server misconfigured: missing env vars" });
  }

  try {
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

// ✅ After service is resumed, reset global logout flag
try {
  await fetch(`${FURNITURE_API_BASE_URL}/api/admin/global-logout/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": GLOBAL_ADMIN_SECRET
    }
  });
} catch (err) {
  console.error("Failed to reset global logout flag:", err);
  // don’t fail the whole restart if reset fails
}

return res.json({ success: true, message: "✅ Service resumed (restarted) and logout flag reset" });


  } catch (err) {
    console.error("Restart error:", err);
    return res.status(500).json({ error: err.message });
  }
}
