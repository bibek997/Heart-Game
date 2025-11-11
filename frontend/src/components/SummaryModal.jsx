import React from "react";

export default function SummaryModal({ show, score, accuracy, userBestScore, globalHighScore, onPlayAgain, onClose }) {
  if (!show) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "#fff", padding: 30, borderRadius: 12, width: 400, textAlign: "center" }}>
        <h2>🏁 Game Summary</h2>
        <p><strong>Final Score:</strong> {score}</p>
        <p><strong>Accuracy:</strong> {accuracy}%</p>
        <p><strong>Your Best Score:</strong> {userBestScore}</p>
        <p><strong>Global Highscore:</strong> {globalHighScore}</p>

        <div style={{ marginTop: 20 }}>
          <button onClick={onPlayAgain} style={{ background: "#16A34A", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer", marginRight: 10 }}>🔁 Play Again</button>
          <button onClick={onClose} style={{ background: "#9CA3AF", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}
