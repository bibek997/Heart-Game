import React, { useState, useEffect, useRef } from "react";
import { fetchPuzzle, validateGuess } from "../api";
import { useAuth } from "../AuthContext";
import { updateUserScore } from "../firebase";
import { logout as fbLogout } from "../firebase";
import { useNavigate } from "react-router-dom";

import GameHeader   from "./GameHeader";
import MainGame     from "./MainGame";
import Leaderboard  from "./Leaderboard";

const TOTAL = 10;
const TIME  = 15;

export default function Game() {
  const { user, data } = useAuth();
  const nav            = useNavigate();

  /* ---------- state ---------- */
  const [round, setRound]     = useState(1);
  const [score, setScore]     = useState(0);
  const [streak, setStreak]   = useState(0);
  const [img, setImg]         = useState("");
  const [tok, setTok]         = useState("");
  const [guess, setGuess]     = useState("");
  const [left, setLeft]       = useState(TIME);
  const [imgLoading, setImgLoading] = useState(true);
  const [gameOver, setGameOver]     = useState(false);
  const [summary, setSummary]       = useState(null);
  const [top10, setTop10]           = useState([]);

  const timerId = useRef(null);

  /*lifecycle*/
  useEffect(() => {
    loadPuzzle();
    import("../firebase").then(m => m.fetchTop10().then(setTop10));
    return () => clearInterval(timerId.current);
  }, []);

  /*auto-submit when timer hits 0*/
  useEffect(() => {
    if (left === 0 && !gameOver) {
      (async () => {
        clearInterval(timerId.current);
        await submit(true);
      })();
    }
  }, [left, gameOver]);

  /*timer*/
  const startTimer = () => {
    clearInterval(timerId.current);
    setLeft(TIME);
    timerId.current = setInterval(() => {
      setLeft(l => (l <= 1 ? 0 : l - 1));
    }, 1000);
  };

  /*puzzle*/
  const loadPuzzle = async () => {
    if (round > TOTAL) return;
    setImgLoading(true);
    try {
      const p   = await fetchPuzzle();
      setImg(p.image);
      setTok(p.gameToken);
      setGuess("");
      startTimer();
    } catch (e) {
      console.error("load puzzle failed", e);
    }
  };

  /*submit*/
  const submit = async (isTimeout = false) => {
    if (gameOver) return;
    const res = await validateGuess(tok, Number(guess) || 0);
    const ok  = res.correct;

    const earned   = ok ? 20 + streak * 5 : 0;
    const nowScore = score + earned;
    setScore(nowScore);

    if (ok) setStreak(s => s + 1);
    else    setStreak(0);

    if (round === TOTAL) {               
      showSummary(nowScore, ok ? streak + 1 : 0);
      return;
    }
    setRound(r => r + 1);                
    loadPuzzle();
  };

  /*summary*/
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

  /*resets*/
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

  /*summary modal*/
  if (gameOver)
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center border border-gray-200 relative">
            <button onClick={newGame} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
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
              <button onClick={newGame} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm hover:shadow-md">Play Again</button>
              <button onClick={handleLogout} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm border border-gray-200">Logout</button>
            </div>
          </div>
        </div>
      </>
    );

  /*main layout*/
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <GameHeader userName={data?.name || user.email} onLogout={handleLogout} />
        <div className="grid lg:grid-cols-3 gap-4">
          <MainGame
            round={round}
            score={score}
            streak={streak}
            left={left}
            img={img}
            imgLoading={imgLoading}
            setImgLoading={setImgLoading}
            guess={guess}
            setGuess={setGuess}
            onSubmit={() => submit()}
            total={TOTAL}
          />
          <Leaderboard list={top10} />
        </div>
      </div>
    </div>
  );
}