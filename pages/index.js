import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  const callApi = async (path) => {
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      setMessage(data.message || "Done");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <div>
        <button onClick={() => callApi("/api/logout")}>🔒 Logout All & Suspend Backend</button>
        <button onClick={() => callApi("/api/restart")}>🔄 Restart Service</button>
        
      </div>
      <p style={{ marginTop: "24px", fontWeight: "bold" }}>{message}</p>
    </div>
  );
}
