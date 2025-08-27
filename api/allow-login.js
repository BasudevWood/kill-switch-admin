// api/allow-login.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { FURNITURE_API_BASE_URL, GLOBAL_ADMIN_SECRET } = process.env;

  if (!FURNITURE_API_BASE_URL || !GLOBAL_ADMIN_SECRET) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  try {
    // call Furniture backend reset route
    const backendRes = await fetch(`${FURNITURE_API_BASE_URL}/api/admin/global-logout/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": GLOBAL_ADMIN_SECRET
      }
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return res.status(500).json({ error: "Backend reset failed", details: data });
    }

    return res.json({ success: true, message: "✅ Login allowed again", data });
  } catch (err) {
    console.error("allow-login error:", err);
    return res.status(500).json({ error: err.message });
  }
}
