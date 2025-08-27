import React, { useState } from "react";
import { globalLogout, resumeBackend, healthCheck } from "../utils/api";

export default function KillSwitchPanel() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // 🔒 Logout All + Suspend
  async function handleLogoutAndSuspend() {
    try {
      setLoading(true);
      setStatus("Suspending backend and logging out all users...");
      await globalLogout("Admin forced global logout");
      setStatus("✅ Force logout set. Backend will suspend.");
    } catch (err) {
      setStatus("❌ Error suspending backend: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔄 Restart Service
  async function handleRestart() {
    try {
      setLoading(true);
      setStatus("Restarting service... waiting for backend health...");

      // keep pinging backend until alive
      let alive = false;
      while (!alive) {
        try {
          await healthCheck();
          alive = true;
        } catch {
          await new Promise(res => setTimeout(res, 3000)); // wait 3s
        }
      }

      // once backend is alive → call resume
      await resumeBackend();
      setStatus("🟢 Backend resumed. Users can login now.");
    } catch (err) {
      setStatus("❌ Error restarting: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>⚡ Kill Switch Admin Panel</h2>
      <button
        style={{ margin: "10px", padding: "10px", background: "red", color: "white" }}
        onClick={handleLogoutAndSuspend}
        disabled={loading}
      >
        🔒 Logout All & Suspend Backend
      </button>

      <button
        style={{ margin: "10px", padding: "10px", background: "green", color: "white" }}
        onClick={handleRestart}
        disabled={loading}
      >
        🔄 Restart Service
      </button>

      {loading && <p>⏳ Working...</p>}
      {status && <p>{status}</p>}
    </div>
  );
}
