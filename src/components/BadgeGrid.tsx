import type { Badge } from '../types';

interface BadgeDefinitionSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface BadgeGridProps {
  earnedBadges: Badge[];
  allDefinitions: BadgeDefinitionSummary[];
}

export default function BadgeGrid({ earnedBadges, allDefinitions }: BadgeGridProps) {
  const earnedMap = new Map(earnedBadges.map((b) => [b.id, b]));

  const sorted = [...allDefinitions].sort((a, b) => {
    const aEarned = earnedMap.has(a.id);
    const bEarned = earnedMap.has(b.id);
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {sorted.map((def) => {
        const earned = earnedMap.get(def.id);
        return (
          <div
            key={def.id}
            className={`rounded-xl border p-4 text-center transition-all duration-200 ${
              earned
                ? 'bg-white border-amber-200 shadow-sm'
                : 'bg-slate-50 border-slate-200 opacity-50'
            }`}
          >
            <span className={`text-3xl block mb-2 ${earned ? '' : 'grayscale'}`}>
              {def.icon}
            </span>
            <p className="text-sm font-semibold text-slate-800">{def.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{def.description}</p>
            {earned ? (
              <p className="text-[0.65rem] text-amber-600 mt-2">
                {new Date(earned.earnedAt).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-[0.65rem] text-slate-400 mt-2">Locked</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
