import { useAppStore } from '../store/useAppStore';

const MODE_LABELS: Record<string, string> = {
  practice: 'Practice',
  'weak-areas': 'Weak Areas',
  'domain-review': 'Domain Review',
  'timed-module': 'Timed Module',
  'mixed-practice': 'Mixed Practice',
  'spaced-review': 'Spaced Review',
  'boss-fight': 'Boss Fight',
  'adaptive-mock-test': 'Mock Test',
};

export default function ActivityLog() {
  const { sessionHistory } = useAppStore();

  // Newest first
  const sorted = [...sessionHistory].reverse();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Activity Log</h1>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No sessions completed yet. Start practicing to see your history here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((entry, i) => {
            const date = new Date(entry.timestamp);
            const scoreColor =
              entry.score >= 80
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : entry.score >= 50
                ? 'text-amber-600 bg-amber-50 border-amber-200'
                : 'text-red-600 bg-red-50 border-red-200';

            return (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                      {MODE_LABELS[entry.mode] ?? entry.mode}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium">
                    {entry.correctAnswers}/{entry.questionsAnswered} correct
                  </p>
                  <p className="text-xs text-slate-400">
                    {date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {date.toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div
                  className={`text-lg font-bold rounded-lg border px-3 py-1.5 tabular-nums ${scoreColor}`}
                >
                  {entry.score}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
