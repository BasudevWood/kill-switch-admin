import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  const handleKill = async () => {
    setMessage("Processing kill...");
    try {
      const res = await fetch("/api/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setMessage(data.message || "Service kill triggered");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  const handleRestart = async () => {
    setMessage("Processing restart...");
    try {
      const res = await fetch("/api/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setMessage(data.message || "Service restart triggered");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      

      <div style={{ marginTop: "30px" }}>
        <button onClick={handleKill} style={{ padding: "12px 20px", marginRight: "12px" }}>
          🛑 Kill Service
        </button>

        <button onClick={handleRestart} style={{ padding: "12px 20px" }}>
          🔄 Restart Service
        </button>
      </div>

      <p style={{ marginTop: "24px", fontWeight: "bold" }}>{message}</p>

      
    </div>
  );
}
