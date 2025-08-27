// kill-switch-admin/api/restart.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { RENDER_API_KEY, BACKEND_URL } = process.env;
  const SERVICE_ID =
    process.env.RENDER_BACKEND_SERVICE_ID ||
    process.env.RENDER_SERVICE_ID ||
    process.env.SERVICE_ID;

  if (!RENDER_API_KEY || !SERVICE_ID || !BACKEND_URL) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  try {
    // 1) Resume the service
    const response = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/resume`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${RENDER_API_KEY}`, "Accept": "application/json" }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "Render API error: " + text });
    }

    // 2) Wait a few seconds for backend to come alive
    await new Promise(r => setTimeout(r, 8000));

    // 3) Ping backend `/` to reset forceLogout=false
    await fetch(`${BACKEND_URL}/`);

    return res.json({
      success: true,
      message: "✅ Backend service restarted and forceLogout reset to false."
    });
  } catch (err) {
    console.error("Restart error:", err);
    return res.status(500).json({ error: err.message });
  }
}
