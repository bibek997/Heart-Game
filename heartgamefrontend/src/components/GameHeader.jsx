import React from "react";

export default function GameHeader({ userName, onLogout }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 font-medium mb-1">Playing as</div>
          <div className="text-lg font-semibold text-gray-900">{userName}</div>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors font-medium text-sm border"
        >
          Logout
        </button>
      </div>
    </div>
  );
}