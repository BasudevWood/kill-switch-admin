// kill-switch-admin/api/allow-login.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { FURNITURE_API_BASE_URL, GLOBAL_ADMIN_SECRET } = process.env;

  if (!FURNITURE_API_BASE_URL || !GLOBAL_ADMIN_SECRET) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  try {
    const backendRes = await fetch(`${FURNITURE_API_BASE_URL}/api/admin/allow-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": GLOBAL_ADMIN_SECRET,
        "Accept": "application/json"
      }
    });

    let data = null;
    try { data = await backendRes.json(); } catch (_) { /* ignore non-JSON */ }

    if (!backendRes.ok) {
      return res.status(500).json({ error: "Allow login failed", details: data || null });
    }

    return res.json({ success: true, message: "✅ Logins allowed again", data });
  } catch (err) {
    console.error("allow-login error:", err);
    return res.status(500).json({ error: err.message });
  }
}
