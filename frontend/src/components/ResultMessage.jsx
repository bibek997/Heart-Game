import React from "react";

export default function ResultMessage({ result, streak }) {
  if (!result) return null;

  return (
    <div style={{ textAlign: "center", marginTop: 12 }}>
      {result.reason === "timeout" ? (
        <span style={{ color: "crimson" }}>⏰ Time's up! The answer was {result.solution ?? "?"}.</span>
      ) : result.correct ? (
        <span style={{ color: "green" }}>✅ Correct! +Points (Streak {streak})</span>
      ) : (
        <span style={{ color: "#cc5500" }}>❌ Wrong! The correct answer was {result.solution}</span>
      )}
    </div>
  );
}
