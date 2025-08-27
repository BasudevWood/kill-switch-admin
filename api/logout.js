import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { RENDER_API_KEY, FURNITURE_API_BASE_URL, GLOBAL_ADMIN_SECRET } = process.env;
  const SERVICE_ID = process.env.RENDER_BACKEND_SERVICE_ID || process.env.SERVICE_ID;

  if (!RENDER_API_KEY || !SERVICE_ID || !FURNITURE_API_BASE_URL || !GLOBAL_ADMIN_SECRET) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  try {
    // 1) tell Furniture backend to force logout
    await fetch(`${FURNITURE_API_BASE_URL}/api/admin/global-logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": GLOBAL_ADMIN_SECRET
      },
      body: JSON.stringify({ message: "Forced logout via kill-switch-admin" })
    });

    // 2) suspend backend on Render
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
