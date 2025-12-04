import React from "react";

export default function Leaderboard({ list }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
        <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        Leaderboard
      </h3>
      <div className="space-y-2">
        {list.map((u, index) => (
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
  );
}