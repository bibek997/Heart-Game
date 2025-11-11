import React from "react";

export default function ScoreBoard({ score, streak, roundsPlayed, roundsLimit, userBestScore, globalHighScore, timeLeft }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", background: "#f3f4f6", borderRadius: 12, padding: "10px 20px" }}>
      <div><strong>Score:</strong> {score}</div>
      <div><strong>Your Best:</strong> {userBestScore}</div>
      <div><strong>Global Highscore:</strong> {globalHighScore}</div>
      <div><strong>Streak:</strong> {streak}</div>
      <div><strong>Round:</strong> {roundsPlayed}/{roundsLimit}</div>
      <div style={{ color: timeLeft <= 5 ? "crimson" : "#1f2937" }}>⏱ {timeLeft}s</div>
    </div>
  );
}
