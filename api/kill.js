// pages/api/kill.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const RENDER_API_KEY = process.env.RENDER_API_KEY;
  const SERVICE_ID = process.env.RENDER_SERVICE_ID;

  if (!RENDER_API_KEY || !SERVICE_ID) {
    return res.status(500).json({ error: "Server misconfigured: missing env vars" });
  }

  try {
    const response = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/suspend`, {
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

    return res.json({ success: true, message: "🚫 Service suspended (killed)" });
  } catch (err) {
    console.error("Kill error:", err);
    return res.status(500).json({ error: err.message });
  }
}
