import React, { useState, useEffect, useRef } from "react";
import { fetchPuzzle, validateGuess } from "./api";
import { useAuth } from "./AuthContext";
import { updateUserScore } from "./firebase";
import { logout as fbLogout } from "./firebase";
import { useNavigate } from "react-router-dom";

const TOTAL = 10;
const TIME  = 15;

export default function Game() {
  const { user, data } = useAuth();
  const nav = useNavigate();

  /* ---------- game state ---------- */
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [img, setImg] = useState("");
  const [tok, setTok] = useState("");
  const [guess, setGuess] = useState("");

  /* ---------- timer ---------- */
  const [left, setLeft] = useState(TIME);
  const timerId = useRef(null);

  /* ---------- flags / ui ---------- */
  const [imgLoading, setImgLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [summary, setSummary] = useState(null);
  const [top10, setTop10] = useState([]);

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    loadPuzzle();
    import("./firebase").then(m => m.fetchTop10().then(setTop10));
    return () => clearInterval(timerId.current);
  }, []);

  /* ➜ FORCE submit on 10th-round timeout ----------------------------- */
  useEffect(() => {
    if (round === TOTAL && left === 0 && !gameOver) {
      (async () => {
        clearInterval(timerId.current);
        await submit(true);          // true = forced submit (timeout)
      })();
    }
  }, [left, round, gameOver]);

  /* ---------- timer helpers ---------- */
  const startTimer = () => {
    clearInterval(timerId.current);
    setLeft(TIME);
    timerId.current = setInterval(() => {
      setLeft(l => {
        if (l <= 1) {
          clearInterval(timerId.current);
          return 0;                  // the above useEffect will pick up left===0
        }
        return l - 1;
      });
    }, 1000);
  };

  /* ---------- puzzle ---------- */
  const loadPuzzle = async () => {
    if (round > TOTAL) return;
    setImgLoading(true);
    try {
      const p = await fetchPuzzle();
      setImg(p.image);
      setTok(p.gameToken);
      setGuess("");
      startTimer();
    } catch (e) {
      console.error("load puzzle failed", e);
    }
  };

  /* ---------- submit ---------- */
  const submit = async (isForced = false) => {
    if (gameOver) return;
    const res = await validateGuess(tok, Number(guess) || 0); // 0 if empty
    const ok = res.correct;

    // scoring: 20 base + 5 per streak
    const earned = ok ? 20 + streak * 5 : 0;
    const nowScore = score + earned;
    setScore(nowScore);

    if (ok) {
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    // always end after round 10
    if (round === TOTAL) {
      showSummary(nowScore, ok ? streak + 1 : 0);
      return;
    }
    setRound(r => r + 1);
    loadPuzzle();
  };

  /* ---------- summary ---------- */
  function showSummary(finalScore, finalStreak) {
    setGameOver(true);
    const newBest = Math.max((data?.bestScore || 0), finalScore);
    updateUserScore(user.uid, finalScore, newBest, finalStreak);
    import("./firebase").then(m => m.getUserData(user.uid)).then(fd =>
      setSummary({
        score: finalScore,
        bestScore: Math.max((fd?.bestScore || 0), finalScore),
        bestStreak: finalStreak,
      })
    );
  }

  const newGame = () => {
    setRound(1);
    setScore(0);
    setStreak(0);
    setGuess("");
    setGameOver(false);
    setSummary(null);
    loadPuzzle();
  };

  const handleLogout = async () => {
    await fbLogout();
    nav("/login");
  };

  /* ---------- SUMMARY MODAL ---------- */
  if (gameOver)
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-center relative">
            <button onClick={newGame} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-2xl font-bold mb-4">Great job! 🎉</h2>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-pink-100 rounded-xl p-3"><div className="text-xl font-bold text-pink-700">{summary?.score ?? score}</div><div className="text-xs text-pink-600">Your Score</div></div>
              <div className="bg-indigo-100 rounded-xl p-3"><div className="text-xl font-bold text-indigo-700">{summary?.bestScore ?? Math.max((data?.bestScore || 0), score)}</div><div className="text-xs text-indigo-600">All-Time Best</div></div>
              <div className="bg-green-100 rounded-xl p-3"><div className="text-xl font-bold text-green-700">{summary?.bestStreak ?? streak}</div><div className="text-xs text-green-600">Highest Streak</div></div>
            </div>
            <div className="flex gap-3">
              <button onClick={newGame} className="flex-1 bg-pink-600 text-white py-2.5 rounded-lg hover:bg-pink-700 transition">Play Again</button>
              <button onClick={handleLogout} className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg hover:bg-gray-300 transition">Logout</button>
            </div>
          </div>
        </div>
      </>
    );

  /* ---------- MAIN GAME ---------- */
  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-3">
        <div className="md:col-span-3 bg-white/80 backdrop-blur rounded-2xl shadow-lg p-4 flex items-center justify-between">
          <div><div className="text-sm text-gray-500">Playing as</div><div className="text-xl font-bold text-gray-800">{data?.name || user.email}</div></div>
          <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition">Logout</button>
        </div>

        <div className="md:col-span-2 bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-4 gap-3 text-center mb-4">
            <div className="bg-pink-100 rounded-xl p-3"><div className="text-lg font-bold text-pink-700">{round}/10</div><div className="text-xs text-pink-600">Round</div></div>
            <div className="bg-indigo-100 rounded-xl p-3"><div className="text-lg font-bold text-indigo-700">{score}</div><div className="text-xs text-indigo-600">Score</div></div>
            <div className="bg-green-100 rounded-xl p-3"><div className="text-lg font-bold text-green-700">{streak}</div><div className="text-xs text-green-600">Streak</div></div>
            <div className="bg-rose-100 rounded-xl p-3"><div className="text-lg font-bold text-rose-700">{left}s</div><div className="text-xs text-rose-600">Time</div></div>
          </div>

          <div className="relative mb-4 rounded-xl overflow-hidden shadow-md">
            {imgLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
                <div className="w-12 h-12 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin" />
              </div>
            )}
            <img src={img || undefined} alt="puzzle" className="w-full object-cover" onLoad={() => setImgLoading(false)} onError={() => setImgLoading(false)} />
          </div>

          <form onSubmit={e => { e.preventDefault(); submit(); }} className="flex gap-3 items-center">
            <input
              type="number"
              value={guess}
              onChange={e => setGuess(e.target.value)}
              placeholder="How many hearts?"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              type="submit"
              disabled={!guess}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition"
            >
              Lock-in
            </button>
          </form>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-3">Top 10</h3>
          <ol className="list-decimal pl-5 space-y-1">
            {top10.map(u => <li key={u.id} className="flex justify-between"><span>{u.name}</span><span className="font-semibold">{u.bestScore}</span></li>)}
          </ol>
        </div>
      </div>
    </div>
  );
}