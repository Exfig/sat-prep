import { useEffect, useState } from 'react';
import type { UsageStats } from '../../services/adminService';
import { fetchUsageStats } from '../../services/adminService';

export default function UsageStatsTab() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await fetchUsageStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage stats');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 rounded-lg p-4">{error}</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Questions Answered" value={stats.totalAttempts} />
        <StatCard label="Overall Accuracy" value={stats.overallAccuracy != null ? `${stats.overallAccuracy}%` : '—'} />
        <StatCard label="Active Today" value={stats.activeToday} />
        <StatCard label="Active This Week" value={stats.activeThisWeek} />
      </div>

      {/* Section breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Section Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SectionCard
            label="Reading & Writing"
            attempts={stats.rwAttempts}
            accuracy={stats.rwAccuracy}
            color="indigo"
          />
          <SectionCard
            label="Math"
            attempts={stats.mathAttempts}
            accuracy={stats.mathAccuracy}
            color="violet"
          />
        </div>
      </div>

      {/* Mock test stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Mock Tests</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalMockTests}</div>
            <div className="text-sm text-slate-500">Total Tests Taken</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.avgMockScore ?? '—'}</div>
            <div className="text-sm text-slate-500">Average Combined Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function SectionCard({
  label,
  attempts,
  accuracy,
  color,
}: {
  label: string;
  attempts: number;
  accuracy: number | null;
  color: 'indigo' | 'violet';
}) {
  const bgClass = color === 'indigo' ? 'bg-indigo-50' : 'bg-violet-50';
  const textClass = color === 'indigo' ? 'text-indigo-700' : 'text-violet-700';

  return (
    <div className={`${bgClass} rounded-lg p-4`}>
      <div className={`text-sm font-semibold ${textClass} mb-3`}>{label}</div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xl font-bold text-slate-900">{attempts}</div>
          <div className="text-xs text-slate-500">Attempts</div>
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900">{accuracy != null ? `${accuracy}%` : '—'}</div>
          <div className="text-xs text-slate-500">Accuracy</div>
        </div>
      </div>
    </div>
  );
}
