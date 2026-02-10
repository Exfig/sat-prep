import { useEffect, useState } from 'react';
import type { QuestionStatsRow, ErrorBreakdownRow } from '../../services/adminService';
import { fetchQuestionStats, fetchQuestionErrorBreakdown } from '../../services/adminService';
import { getQuestionById } from '../../data/questions';
import { DOMAIN_NAMES } from '../../types';
import type { SectionId, DomainId } from '../../types';
import SectionToggle from '../SectionToggle';

type SortKey = 'question_id' | 'total_attempts' | 'accuracy' | 'avg_hints_used';
type SortDir = 'asc' | 'desc';

export default function QuestionDataTab() {
  const [stats, setStats] = useState<QuestionStatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<SectionId | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('total_attempts');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorBreakdown, setErrorBreakdown] = useState<Record<string, ErrorBreakdownRow[]>>({});

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await fetchQuestionStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question stats');
    } finally {
      setLoading(false);
    }
  }

  async function toggleExpand(questionId: string) {
    if (expandedId === questionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(questionId);
    if (!errorBreakdown[questionId]) {
      try {
        const breakdown = await fetchQuestionErrorBreakdown(questionId);
        setErrorBreakdown((prev) => ({ ...prev, [questionId]: breakdown }));
      } catch {
        // silently fail, row just shows no breakdown
      }
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  // Enrich with question metadata and filter
  const enriched = stats.map((s) => {
    const q = getQuestionById(s.question_id);
    return { ...s, question: q };
  });

  const filtered = enriched.filter((s) => {
    if (sectionFilter && s.question?.section !== sectionFilter) return false;
    if (domainFilter !== 'all' && s.question?.domain !== domainFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Collect domains for the filter dropdown
  const availableDomains = [...new Set(enriched.map((s) => s.question?.domain).filter(Boolean))] as DomainId[];
  const filteredDomains = sectionFilter
    ? availableDomains.filter((d) => (sectionFilter === 'reading-writing' ? d.startsWith('rw-') : d.startsWith('math-')))
    : availableDomains;

  function accuracyColor(acc: number) {
    if (acc >= 80) return 'text-emerald-700 bg-emerald-50';
    if (acc >= 50) return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  }

  const SortArrow = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-slate-300 ml-1">{'\u2195'}</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

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

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <SectionToggle selected={sectionFilter} onChange={(s) => { setSectionFilter(s); setDomainFilter('all'); }} />
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Domains</option>
          {filteredDomains.map((d) => (
            <option key={d} value={d}>{DOMAIN_NAMES[d]}</option>
          ))}
        </select>
      </div>

      <div className="text-sm text-slate-500 mb-3">{sorted.length} question{sorted.length !== 1 ? 's' : ''} with data</div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600 cursor-pointer select-none" onClick={() => handleSort('question_id')}>
                Question <SortArrow col="question_id" />
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">Domain</th>
              <th className="px-4 py-3 font-medium text-slate-600">Difficulty</th>
              <th className="px-4 py-3 font-medium text-slate-600 text-right cursor-pointer select-none" onClick={() => handleSort('total_attempts')}>
                Attempts <SortArrow col="total_attempts" />
              </th>
              <th className="px-4 py-3 font-medium text-slate-600 text-right cursor-pointer select-none" onClick={() => handleSort('accuracy')}>
                Accuracy <SortArrow col="accuracy" />
              </th>
              <th className="px-4 py-3 font-medium text-slate-600 text-right cursor-pointer select-none" onClick={() => handleSort('avg_hints_used')}>
                Avg Hints <SortArrow col="avg_hints_used" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((row) => (
              <>
                <tr
                  key={row.question_id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleExpand(row.question_id)}
                >
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <span className="mr-1 text-slate-400">{expandedId === row.question_id ? '\u25BC' : '\u25B6'}</span>
                    {row.question?.skill ?? row.question_id}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {row.question?.domain ? DOMAIN_NAMES[row.question.domain as DomainId] ?? row.question.domain : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      row.question?.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700' :
                      row.question?.difficulty === 'hard' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {row.question?.difficulty ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{row.total_attempts}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${accuracyColor(row.accuracy)}`}>
                      {row.accuracy}%
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{row.avg_hints_used}</td>
                </tr>
                {expandedId === row.question_id && (
                  <tr key={`${row.question_id}-detail`} className="bg-slate-50">
                    <td colSpan={6} className="px-8 py-3">
                      <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                        Error Category Breakdown (incorrect attempts)
                      </div>
                      {errorBreakdown[row.question_id] ? (
                        errorBreakdown[row.question_id].length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {errorBreakdown[row.question_id].map((eb) => (
                              <span
                                key={eb.error_category}
                                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                              >
                                <span className="font-medium text-slate-700 capitalize">
                                  {eb.error_category.replace(/-/g, ' ')}
                                </span>
                                <span className="text-slate-400">({eb.count})</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400">No incorrect attempts recorded</div>
                        )
                      ) : (
                        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
