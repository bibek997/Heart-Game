import React from "react";

export default function GuessForm({ guess, setGuess, onSubmit, disabled }) {
  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      <input
        type="number"
        min="0"
        placeholder="Enter guess"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        disabled={disabled}
        style={{ padding: "10px", borderRadius: 8, border: "1px solid #ccc", width: 120 }}
      />
      <button type="submit" disabled={disabled} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#2563EB", color: "#fff", cursor: "pointer" }}>Submit</button>
    </form>
  );
}
