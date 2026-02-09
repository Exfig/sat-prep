interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
}

export default function ProgressBar({ value, max, label, color = 'bg-indigo-600' }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-sm text-slate-500">{pct}%</span>
        </div>
      )}
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
