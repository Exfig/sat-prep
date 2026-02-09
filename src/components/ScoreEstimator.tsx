import type { SATScore } from '../types';

interface ScoreEstimatorProps {
  score: SATScore;
}

function getColorClasses(total: number): {
  bar: string;
  text: string;
  badge: string;
} {
  if (total >= 1400) {
    return {
      bar: 'bg-indigo-500',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800',
    };
  }
  if (total >= 1200) {
    return {
      bar: 'bg-emerald-500',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800',
    };
  }
  if (total >= 1000) {
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800',
    };
  }
  return {
    bar: 'bg-red-500',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
  };
}

function ScoreBar({
  label,
  score,
  min,
  max,
  colorBar,
}: {
  label: string;
  score: number;
  min: number;
  max: number;
  colorBar: string;
}) {
  const pct = Math.min(100, Math.max(0, ((score - min) / (max - min)) * 100));

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{score}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorBar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-xs text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function ScoreEstimator({ score }: ScoreEstimatorProps) {
  const colors = getColorClasses(score.total);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Estimated SAT Score
      </h3>

      {/* Total score - prominent display */}
      <div className="mb-6 flex flex-col items-center rounded-lg bg-slate-50 py-4">
        <span className="text-sm font-medium text-slate-500">Total Score</span>
        <span className={`text-5xl font-bold tracking-tight ${colors.text}`}>
          {score.total}
        </span>
        <span
          className={`mt-1 rounded-full px-3 py-0.5 text-xs font-semibold ${colors.badge}`}
        >
          {score.total >= 1400
            ? 'Excellent'
            : score.total >= 1200
              ? 'Great'
              : score.total >= 1000
                ? 'Good'
                : 'Keep Practicing'}
        </span>
        <span className="mt-1 text-xs text-slate-400">out of 1600</span>
      </div>

      {/* Section scores */}
      <div className="space-y-4">
        <ScoreBar
          label="Reading & Writing"
          score={score.readingWriting}
          min={200}
          max={800}
          colorBar={colors.bar}
        />
        <ScoreBar
          label="Math"
          score={score.math}
          min={200}
          max={800}
          colorBar={colors.bar}
        />
      </div>
    </div>
  );
}
