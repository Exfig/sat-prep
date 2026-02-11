import { useState } from 'react';

interface StrategyTipBannerProps {
  tip: string;
}

export default function StrategyTipBanner({ tip }: StrategyTipBannerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
        aria-expanded={expanded}
      >
        {/* Light bulb icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 shrink-0 text-amber-500"
          aria-hidden="true"
        >
          <path d="M12 2a7 7 0 0 0-4.5 12.37V16a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1.63A7 7 0 0 0 12 2Zm2.5 15h-5v1a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-1Z" />
        </svg>
        <span>Strategy Tip</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm leading-relaxed text-amber-900">{tip}</p>
        </div>
      )}
    </div>
  );
}
