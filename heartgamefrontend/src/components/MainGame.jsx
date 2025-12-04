import React from "react";

export default function MainGame({
  round,
  score,
  streak,
  left,
  img,
  imgLoading,
  guess,
  setGuess,
  onSubmit,
  total,
  setImgLoading
}) {
  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      {/* stats */ }
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="text-lg font-bold text-blue-700">{round}/{total}</div>
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

      {/* image */ }
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
          alt="puzzle"
          className="w-full h-100 object-cover transition-opacity duration-300"
          onLoad={() => setImgLoading(false)}
          onError={() => setImgLoading(false)}
        />
      </div>

      {/* input */ }
      <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="flex gap-3">
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
          disabled={!guess} // disable only when empty
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm shadow-sm hover:shadow-md disabled:shadow-none"
        >
          Submit
        </button>
      </form>
    </div>
  );
}