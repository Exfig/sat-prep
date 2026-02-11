import type { DomainStats, SectionId } from '../types';
import { DOMAIN_NAMES, SECTION_NAMES, getDomainSection } from '../types';

interface DomainBreakdownChartProps {
  domainStats: DomainStats[];
}

function getBarColor(accuracy: number): string {
  if (accuracy < 40) return 'bg-red-500';
  if (accuracy <= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function DomainBreakdownChart({ domainStats }: DomainBreakdownChartProps) {
  // Group domains by section
  const grouped: Record<SectionId, DomainStats[]> = {
    'reading-writing': [],
    'math': [],
  };

  for (const stat of domainStats) {
    const section = getDomainSection(stat.domainId);
    grouped[section].push(stat);
  }

  const sectionIds = Object.keys(grouped) as SectionId[];

  return (
    <div className="space-y-6">
      {sectionIds.map((sectionId) => {
        const stats = grouped[sectionId];
        if (stats.length === 0) return null;

        return (
          <div key={sectionId}>
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-3">
              {SECTION_NAMES[sectionId]}
            </h3>
            <div className="space-y-3">
              {stats.map((stat) => (
                <div key={stat.domainId}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium text-slate-700 truncate min-w-0">
                      {DOMAIN_NAMES[stat.domainId]}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500 shrink-0">
                      {stat.attempted > 0 ? `${Math.round(stat.accuracy)}%` : 'No data'}
                    </span>
                  </div>
                  <div
                    className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={stat.attempted > 0 ? Math.round(stat.accuracy) : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${DOMAIN_NAMES[stat.domainId]} accuracy: ${stat.attempted > 0 ? `${Math.round(stat.accuracy)}%` : 'No data'}`}
                  >
                    {stat.attempted > 0 && (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor(stat.accuracy)}`}
                        style={{ width: `${Math.round(stat.accuracy)}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
