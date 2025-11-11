import React from "react";

export default function PuzzleDisplay({ imageSrc, error, onRetry }) {
  if (error) {
    return (
      <div style={{ color: "red", textAlign: "center", marginBottom: 12 }}>
        {error} <button onClick={onRetry} style={{ marginLeft: 10, padding: "5px 10px", cursor: "pointer" }}>Retry</button>
      </div>
    );
  }
  return (
    <div style={{ minHeight: 260, marginBottom: "12px", textAlign: "center" }}>
      {imageSrc ? (
        <img src={imageSrc} alt="puzzle" style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }} />
      ) : (
        <p>Loading puzzle…</p>
      )}
    </div>
  );
}
