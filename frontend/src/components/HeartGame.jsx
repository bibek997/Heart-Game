import React, { useEffect, useRef, useState } from "react";
import Login from "./Login";
import ScoreBoard from "./ScoreBoard";
import PuzzleDisplay from "./PuzzleDisplay";
import GuessForm from "./GuessForm";
import ResultMessage from "./ResultMessage";
import SummaryModal from "./SummaryModal";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const TIMER_SECONDS = 15;
const BASE_POINTS = 10;
const STREAK_BONUS = 5;
const ROUNDS_LIMIT = 10;

export default function HeartGame() {
  // --- User login state ---
  const [username, setUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  // --- Game state ---
  const [imageSrc, setImageSrc] = useState(null);
  const [gameToken, setGameToken] = useState(null);
  const [guess, setGuess] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const [userBestScore, setUserBestScore] = useState(0);
  const [globalHighScore, setGlobalHighScore] = useState(0);

  // --- Timer functions ---
  function startTimer() {
    stopTimer();
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function decodeJwtPayload(token) {
    if (!token) return null;
    try {
      const [, payload] = token.split(".");
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function handleTimeout() {
    setDisabled(true);
    setStreak(0);
    const payload = decodeJwtPayload(gameToken);
    const sol = payload?.sol ?? null;
    setResult({ correct: false, solution: sol, reason: "timeout" });
    incrementRound();
  }

  // --- Fetch new puzzle ---
  async function fetchNew(base64 = false, retries = 3, delayMs = 1000) {
    stopTimer();
    setDisabled(false);
    setResult(null);
    setGuess("");
    setImageSrc(null);
    setError(null);
    setTimeLeft(TIMER_SECONDS);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/api/new?base64=${base64 ? "yes" : "no"}`);
        const data = await res.json();
        if (!res.ok || !data.image) throw new Error("Invalid response");

        setImageSrc(data.image);
        setGameToken(data.gameToken);
        startTimer();
        return;
      } catch (err) {
        console.warn(`Puzzle fetch attempt ${attempt + 1} failed. Retrying...`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    console.error("Failed to fetch puzzle after retries, retrying again...");
    setTimeout(() => fetchNew(base64), delayMs);
  }

  // --- Submit guess ---
  async function submitGuess(e) {
    e?.preventDefault();
    if (disabled || !guess) return;

    stopTimer();
    setDisabled(true);

    try {
      const res = await fetch(`${API_BASE}/api/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameToken, guess: Number(guess) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation failed");

      setResult({ correct: data.correct, solution: data.solution, reason: "submitted" });

      if (data.correct) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setCorrectAnswers((c) => c + 1);

        const points = BASE_POINTS + (nextStreak - 1) * STREAK_BONUS;
        setScore((s) => {
          const newScore = s + points;
          updateUserScore(newScore);
          return newScore;
        });
      } else {
        setStreak(0);
      }

      incrementRound();
    } catch (err) {
      console.error("Submit error:", err);
      setResult({ correct: false, reason: "error" });
      incrementRound();
    }
  }

  function incrementRound() {
    setRoundsPlayed((r) => {
      const next = r + 1;
      if (next >= ROUNDS_LIMIT) setTimeout(() => setShowSummary(true), 600);
      else setTimeout(() => fetchNew(false), 900);
      return next;
    });
  }

  // --- Update user and global scores ---
  async function updateUserScore(newScore) {
    try {
      const res = await fetch(`${API_BASE}/api/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, score: newScore }),
      });
      const data = await res.json();
      if (data.userBestScore !== undefined) setUserBestScore(data.userBestScore);
      if (data.globalHighScore !== undefined) setGlobalHighScore(data.globalHighScore);
    } catch (err) {
      console.error(err);
    }
  }

  // --- Play again ---
  function playAgain() {
    setScore(0);
    setStreak(0);
    setRoundsPlayed(0);
    setCorrectAnswers(0);
    setResult(null);
    setShowSummary(false);
    fetchNew(false);
  }

  // --- Login handler ---
  const handleLogin = async (user) => {
    setUsername(user);
    setLoggedIn(true);
    await updateUserScore(0); // fetch scores
    fetchNew(false);
  };

  const accuracy = roundsPlayed ? Math.round((correctAnswers / roundsPlayed) * 100) : 0;

  if (!loggedIn) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ fontFamily: "Inter, Segoe UI, Roboto, sans-serif", padding: "30px", maxWidth: 700, margin: "auto" }}>
      <h1 style={{ textAlign: "center", color: "#1E3A8A", marginBottom: "20px" }}>❤️ The Heart Game</h1>

      <ScoreBoard
        score={score}
        streak={streak}
        roundsPlayed={roundsPlayed}
        roundsLimit={ROUNDS_LIMIT}
        userBestScore={userBestScore}
        globalHighScore={globalHighScore}
        timeLeft={timeLeft}
      />

      <PuzzleDisplay imageSrc={imageSrc} error={error} onRetry={() => fetchNew(false)} />
      <GuessForm guess={guess} setGuess={setGuess} onSubmit={submitGuess} disabled={disabled || !imageSrc} />
      <ResultMessage result={result} streak={streak} />

      <SummaryModal
        show={showSummary}
        score={score}
        accuracy={accuracy}
        userBestScore={userBestScore}
        globalHighScore={globalHighScore}
        onPlayAgain={playAgain}
        onClose={() => setShowSummary(false)}
      />
    </div>
  );
}
