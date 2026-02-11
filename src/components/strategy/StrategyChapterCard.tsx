import type { Chapter } from '../../data/strategyGuideContent';

interface StrategyChapterCardProps {
  chapter: Chapter;
  completedSections: string[];
  isCurrent: boolean;
  onStart: () => void;
}

export default function StrategyChapterCard({
  chapter,
  completedSections,
  isCurrent,
  onStart,
}: StrategyChapterCardProps) {
  const totalSections = chapter.sections.length;
  const doneSections = chapter.sections.filter((s) => completedSections.includes(s.id)).length;
  const isComplete = doneSections === totalSections;
  const pct = Math.round((doneSections / totalSections) * 100);

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        isCurrent
          ? 'border-indigo-300 bg-indigo-50 shadow-md ring-2 ring-indigo-200'
          : isComplete
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl shrink-0" aria-hidden="true">{chapter.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Chapter {chapter.number}
            </span>
            {isComplete && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Complete
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">{chapter.title}</h3>
          <p className="text-sm text-slate-600 mb-3">{chapter.description}</p>

          {/* Section progress bar */}
          <div className="mb-3">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {doneSections}/{totalSections} sections
            </p>
          </div>

          <button
            onClick={onStart}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[40px] ${
              isCurrent
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : isComplete
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isComplete ? 'Review' : isCurrent ? 'Continue' : doneSections > 0 ? 'Continue' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
