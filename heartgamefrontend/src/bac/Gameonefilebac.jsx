import React, { useState, useEffect, useRef } from "react";
import { fetchPuzzle, validateGuess } from "../api";
import { useAuth } from "../AuthContext";
import { updateUserScore } from "../firebase";
import { logout as fbLogout } from "../firebase";
import { useNavigate } from "react-router-dom";

const TOTAL = 10;
const TIME  = 15;

export default function Game() {
  const { user, data } = useAuth();
  const nav = useNavigate();

  /* ---------- core state ---------- */
  const [round, setRound]     = useState(1);
  const [score, setScore]     = useState(0);
  const [streak, setStreak]   = useState(0);
  const [img, setImg]         = useState("");
  const [tok, setTok]         = useState("");
  const [guess, setGuess]     = useState("");

  /* ---------- timer ---------- */
  const [left, setLeft]       = useState(TIME);
  const timerId               = useRef(null);

  /* ---------- ui flags ---------- */
  const [imgLoading, setImgLoading] = useState(true);
  const [gameOver, setGameOver]     = useState(false);
  const [summary, setSummary]       = useState(null);
  const [top10, setTop10]           = useState([]);

  /* ---------- initial load ---------- */
  useEffect(() => {
    loadPuzzle();
    import("../firebase").then(m => m.fetchTop10().then(setTop10));
    return () => clearInterval(timerId.current);
  }, []);

  /* ➜ auto-submit when timer hits 0 --------------------------------- */
  useEffect(() => {
    if (left === 0 && !gameOver) {
      (async () => {
        clearInterval(timerId.current);
        await submit(true);          // true = fired by timeout
      })();
    }
  }, [left, gameOver]);

  /* ---------- timer helpers ---------- */
  const startTimer = () => {
    clearInterval(timerId.current);
    setLeft(TIME);
    timerId.current = setInterval(() => {
      setLeft(l => (l <= 1 ? 0 : l - 1));
    }, 1000);
  };

  /* ---------- load next puzzle ---------- */
  const loadPuzzle = async () => {
    if (round > TOTAL) return;       // guard
    setImgLoading(true);
    try {
      const p = await fetchPuzzle();
      setImg(p.image);
      setTok(p.gameToken);
      setGuess("");                  // clear input
      startTimer();
    } catch (e) {
      console.error("load puzzle failed", e);
    }
  };

  /* ---------- submit (manual or forced by timeout) ---------- */
  const submit = async (isTimeout = false) => {
    if (gameOver) return;

    const res = await validateGuess(tok, Number(guess) || 0);
    const ok  = res.correct;

    /* scoring: 20 base + 5 per streak */
    const earned = ok ? 20 + streak * 5 : 0;
    const nowScore = score + earned;
    setScore(nowScore);

    if (ok) {
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    /* ---------- end game after round 10 ---------- */
    if (round === TOTAL) {
      showSummary(nowScore, ok ? streak + 1 : 0);
      return;
    }

    /* ---------- advance round 1-9 ---------- */
    setRound(r => r + 1);
    loadPuzzle();
  };

  /* ---------- show summary modal ---------- */
  function showSummary(finalScore, finalStreak) {
    setGameOver(true);
    const newBest = Math.max((data?.bestScore || 0), finalScore);
    updateUserScore(user.uid, finalScore, newBest, finalStreak);
    import("../firebase").then(m => m.getUserData(user.uid)).then(fd =>
      setSummary({
        score: finalScore,
        bestScore: Math.max((fd?.bestScore || 0), finalScore),
        bestStreak: finalStreak,
      })
    );
  }

  /* ---------- play again (full reset) ---------- */
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center border border-gray-200 relative">
            <button 
              onClick={newGame} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Game Complete</h2>
            <p className="text-gray-600 text-sm mb-6">Congratulations on finishing the challenge!</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="text-base font-semibold text-blue-700">{summary?.score ?? score}</div>
                <div className="text-xs text-blue-600 font-medium mt-1">Final Score</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <div className="text-base font-semibold text-purple-700">{summary?.bestScore ?? Math.max((data?.bestScore || 0), score)}</div>
                <div className="text-xs text-purple-600 font-medium mt-1">Best Score</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="text-base font-semibold text-green-700">{summary?.bestStreak ?? streak}</div>
                <div className="text-xs text-green-600 font-medium mt-1">Best Streak</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={newGame} 
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm hover:shadow-md"
              >
                Play Again
              </button>
              <button 
                onClick={handleLogout} 
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm border border-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </>
    );

  /* ---------- MAIN GAME UI ---------- */
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */ }
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium mb-1">Playing as</div>
              <div className="text-lg font-semibold text-gray-900">{data?.name || user.email}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors font-medium text-sm border"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Game Panel */ }
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              {/* Stats Grid */ }
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="text-lg font-bold text-blue-700">{round}/10</div>
                  <div className="text-xs text-blue-600 font-medium mt-1">Round</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="text-lg font-bold text-purple-700">{score}</div>
                  <div className="text-xs text-purple-600 font-medium mt-1">Score</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="text-lg font-bold text-green-700">{streak}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">Streak</div>
                </div>
                <div className={`rounded-lg p-3 border ${
                  left > 5 ? "bg-gray-50 border-gray-100" : "bg-red-50 border-red-100"
                }`}>
                  <div className={`text-lg font-bold ${left > 5 ? "text-gray-700" : "text-red-700"}`}>{left}s</div>
                  <div className={`text-xs font-medium mt-1 ${left > 5 ? "text-gray-600" : "text-red-600"}`}>Time Left</div>
                </div>
              </div>

              {/* Image Container */ }
              <div className="relative mb-5 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {imgLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full border-3 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-2" />
                      <div className="text-gray-600 text-xs font-medium">Loading puzzle...</div>
                    </div>
                  </div>
                )}
                <img 
                  src={img || undefined} 
                  alt="Counting puzzle" 
                  className="w-full h-100 object-cover transition-opacity duration-300"
                  onLoad={() => setImgLoading(false)} 
                  onError={() => setImgLoading(false)} 
                />
              </div>

              {/* Input Form */ }
              <form onSubmit={e => { e.preventDefault(); submit(); }} className="flex gap-3">
                <input
                  type="number"
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  placeholder="Enter number of hearts..."
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-base font-medium placeholder-gray-400"
                  min="0"
                />
                <button
                  type="submit"
                  disabled={!guess}          // disable only when empty
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm shadow-sm hover:shadow-md disabled:shadow-none"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>

          {/* Leaderboard */ }
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Leaderboard
            </h3>
            <div className="space-y-2">
              {top10.map((u, index) => (
                <div 
                  key={u.id} 
                  className={`flex items-center justify-between p-2 rounded-lg border text-sm ${
                    index === 0 ? "bg-yellow-50 border-yellow-200" :
                    index === 1 ? "bg-gray-50 border-gray-200" :
                    index === 2 ? "bg-orange-50 border-orange-200" :
                    "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? "bg-yellow-400 text-yellow-900" :
                      index === 1 ? "bg-gray-400 text-gray-900" :
                      index === 2 ? "bg-orange-400 text-orange-900" :
                      "bg-blue-400 text-blue-900"
                    }`}>
                      {index + 1}
                    </div>
                    <span className="ml-2 font-medium text-gray-900 truncate max-w-[120px]">{u.name}</span>
                  </div>
                  <span className="font-semibold text-gray-700">{u.bestScore}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}