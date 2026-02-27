import { Fragment, useEffect, useState } from 'react';
import type { FlagRow } from '../../services/adminService';
import { fetchAllFlags, adminResolveFlag } from '../../services/adminService';
import { getQuestionById } from '../../data/questions';
import type { Question } from '../../types';
import { SECTION_NAMES, DOMAIN_NAMES } from '../../types';
import PassageViewer from '../PassageViewer';

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

function QuestionPreview({ question }: { question: Question }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
      {/* Meta tags */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
          {SECTION_NAMES[question.section]}
        </span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
          {DOMAIN_NAMES[question.domain]}
        </span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
          {question.skill}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[question.difficulty]}`}>
          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </span>
      </div>

      {/* Passage */}
      {question.passage && <PassageViewer passage={question.passage} />}

      {/* Visual asset */}
      {question.visualAsset && (
        <div className="flex justify-center">
          <img
            src={`${import.meta.env.BASE_URL}${question.visualAsset.src.replace(/^\//, '')}?v=4`}
            alt={question.visualAsset.altText}
            loading="lazy"
            decoding="async"
            className="max-w-sm rounded-lg border border-slate-200"
          />
        </div>
      )}

      {/* Question text */}
      <p className="text-base font-medium text-slate-800 leading-relaxed">
        {question.question}
      </p>

      {/* Formula */}
      {question.formula && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 font-mono text-indigo-800 text-sm">
          {question.formula}
        </div>
      )}

      {/* Options with correct answer highlighted */}
      {question.type === 'multiple-choice' && question.options && (
        <div className="space-y-2">
          {question.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isCorrect = question.correctAnswer === letter;
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 px-4 py-2.5 rounded-lg border text-sm ${
                  isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <span className={`font-semibold shrink-0 ${isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {letter})
                </span>
                <span>{option}</span>
                {isCorrect && (
                  <span className="ml-auto shrink-0 text-xs font-medium text-emerald-600">Correct</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grid-in answer */}
      {question.type === 'grid-in' && (
        <div className="px-4 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-sm text-emerald-800">
          <span className="font-semibold">Correct answer:</span> {String(question.correctAnswer)}
        </div>
      )}

      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        <p className="font-semibold mb-1">Explanation</p>
        <p className="leading-relaxed">{question.explanation}</p>
      </div>
    </div>
  );
}

export default function FlaggedQuestionsTab() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    loadFlags();
  }, []);

  async function loadFlags() {
    try {
      setLoading(true);
      const data = await fetchAllFlags();
      setFlags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(flagId: string, resolve: boolean) {
    // Optimistic update
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flagId
          ? { ...f, resolved: resolve, resolved_at: resolve ? new Date().toISOString() : null }
          : f,
      ),
    );
    try {
      await adminResolveFlag(flagId, resolve);
    } catch (err) {
      // Revert on error
      setFlags((prev) =>
        prev.map((f) =>
          f.id === flagId
            ? { ...f, resolved: !resolve, resolved_at: !resolve ? new Date().toISOString() : null }
            : f,
        ),
      );
      console.error('Failed to update flag:', err);
    }
  }

  const displayed = showResolved ? flags : flags.filter((f) => !f.resolved);
  const openCount = flags.filter((f) => !f.resolved).length;

  if (loading) {
    return <p className="text-slate-500 py-8 text-center">Loading flags...</p>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-amber-600">{openCount}</span> open flag{openCount !== 1 ? 's' : ''}
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Show resolved
        </label>
      </div>

      {displayed.length === 0 ? (
        <p className="text-slate-400 text-sm py-8 text-center">
          {flags.length === 0 ? 'No flags yet.' : 'No open flags. Toggle "Show resolved" to see past flags.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 px-3 font-medium">Question</th>
                <th className="py-2 px-3 font-medium">Flagged By</th>
                <th className="py-2 px-3 font-medium">Description</th>
                <th className="py-2 px-3 font-medium">Date</th>
                <th className="py-2 px-3 font-medium">Status</th>
                <th className="py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((flag) => {
                const question = getQuestionById(flag.question_id);
                const isExpanded = previewId === flag.id;
                const cbId = flag.question_id.match(/-cb-([a-f0-9]+)$/)?.[1] ?? flag.question_id;
                return (
                  <Fragment key={flag.id}>
                    <tr className={`border-b border-slate-100 ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => setPreviewId(isExpanded ? null : flag.id)}
                          className="text-left font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          title="Click to preview question"
                        >
                          {cbId}
                          <span className="ml-1 text-slate-400">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                        </button>
                        {question && (
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">{question.skill}</p>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <p className="text-slate-800">{flag.user_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{flag.user_email}</p>
                      </td>
                      <td className="py-2 px-3 max-w-[300px]">
                        <p className="text-slate-700 whitespace-pre-wrap">{flag.description}</p>
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3">
                        {flag.resolved ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Resolved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {flag.resolved ? (
                          <button
                            onClick={() => handleResolve(flag.id, false)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            onClick={() => handleResolve(flag.id, true)}
                            className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && question && (
                      <tr>
                        <td colSpan={6} className="p-4 bg-slate-50 border-b border-slate-200">
                          <QuestionPreview question={question} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
