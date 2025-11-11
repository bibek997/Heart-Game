import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) onLogin(username.trim());
  };

  return (
    <div style={{ fontFamily: "Inter, Segoe UI, Roboto, sans-serif", padding: "30px", maxWidth: 400, margin: "auto", textAlign: "center" }}>
      <h2>Login with Username</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: 10, borderRadius: 6, width: "100%" }}
        />
        <button type="submit" style={{ padding: 10, marginTop: 10, width: "100%" }}>Login</button>
      </form>
    </div>
  );
}
