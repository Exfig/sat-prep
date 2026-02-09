import { useState } from 'react';

interface HintPanelProps {
  hints: [string, string];
  currentHint: number;
  onRequestHint: () => void;
  onRetry: () => void;
  hintsAvailable: boolean;
}

export default function HintPanel({
  hints,
  currentHint,
  onRequestHint,
  onRetry,
  hintsAvailable,
}: HintPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!hintsAvailable) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full text-sm font-semibold text-slate-700"
      >
        <span>Hints</span>
        <span className="text-slate-400 text-xs">{collapsed ? 'Show' : 'Hide'}</span>
      </button>

      {!collapsed && (
        <div className="mt-3 space-y-3">
          {currentHint === 0 && (
            <button
              onClick={onRequestHint}
              className="w-full py-2 px-4 rounded-lg bg-amber-50 border border-amber-200
                text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              Need a hint?
            </button>
          )}

          {currentHint >= 1 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-600 mb-1">Hint 1</p>
              <p className="text-sm text-amber-800">{hints[0]}</p>
            </div>
          )}

          {currentHint >= 2 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-600 mb-1">Hint 2</p>
              <p className="text-sm text-amber-800">{hints[1]}</p>
            </div>
          )}

          {currentHint >= 1 && currentHint < 2 && (
            <button
              onClick={onRequestHint}
              className="w-full py-2 px-4 rounded-lg bg-amber-50 border border-amber-200
                text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              Another hint?
            </button>
          )}

          {currentHint >= 1 && (
            <button
              onClick={onRetry}
              className="w-full py-2 px-4 rounded-lg bg-indigo-500 text-white
                text-sm font-medium hover:bg-indigo-600 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
