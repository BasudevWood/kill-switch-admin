// kill-switch-admin/api/restart.js
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

    // 2) Retry reset until backend is alive
    const tryReset = async () => {
      for (let i = 0; i < 5; i++) {  // retry max 5 times
        try {
          console.log(`⏳ Attempt ${i + 1} to reset forceLogout...`);
          const resetRes = await fetch(`${FURNITURE_API_BASE_URL}/api/admin/global-logout/reset`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-secret": GLOBAL_ADMIN_SECRET
            }
          });

          if (resetRes.ok) {
            const data = await resetRes.json();
            console.log("✅ Reset succeeded:", data);
            return { success: true, data };
          } else {
            const text = await resetRes.text();
            console.error(`⚠️ Reset attempt ${i + 1} failed:`, text);
          }
        } catch (err) {
          console.error(`❌ Reset attempt ${i + 1} error:`, err.message);
        }

        // wait 5s before retry
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      return { success: false };
    };

    const resetResult = await tryReset();

    if (!resetResult.success) {
      return res.status(500).json({
        error: "Service resumed, but failed to reset forceLogout after retries"
      });
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
