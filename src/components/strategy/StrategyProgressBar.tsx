import { getTotalSectionCount } from '../../data/strategyGuideContent';

interface StrategyProgressBarProps {
  completedCount: number;
}

export default function StrategyProgressBar({ completedCount }: StrategyProgressBarProps) {
  const total = getTotalSectionCount();
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-700">Overall Progress</span>
        <span className="text-slate-500">
          {completedCount}/{total} sections ({pct}%)
        </span>
      </div>
      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
