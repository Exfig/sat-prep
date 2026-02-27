import { useMemo, useState } from 'react';
import type { SectionId, DomainId, Difficulty } from '../../types';
import { SECTION_NAMES, DOMAIN_NAMES, SECTION_DOMAINS } from '../../types';
import { getQuestionsByDomain } from '../../data/questions';
import type { Question } from '../../types';
import PassageViewer from '../PassageViewer';
import TableViewer from '../TableViewer';

const SECTIONS: SectionId[] = ['reading-writing', 'math'];

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

function QuestionCard({ question }: { question: Question }) {
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
        <span className="px-2 py-1 rounded text-xs font-mono font-medium bg-slate-50 text-slate-400 border border-slate-200">
          {question.id}
        </span>
      </div>

      {/* Passage */}
      {question.passage && <PassageViewer passage={question.passage} />}

      {/* Table data */}
      {question.tableData && <TableViewer tableData={question.tableData} />}

      {/* Visual asset */}
      {question.visualAsset && (
        <div className="flex justify-center">
          <img
            src={`${import.meta.env.BASE_URL}${question.visualAsset.src.replace(/^\//, '')}?v=4`}
            alt={question.visualAsset.altText}
            loading="lazy"
            decoding="async"
            style={question.visualAsset?.maxWidth ? { maxWidth: question.visualAsset.maxWidth } : undefined}
            className={`max-w-full ${question.visualAsset?.maxWidth ? '' : 'sm:max-w-sm'} rounded-lg border border-slate-200`}
          />
        </div>
      )}

      {/* Question text */}
      <p className="text-base font-medium text-slate-800 leading-relaxed whitespace-pre-line">
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
            const isCorrect = question.correctAnswer === letter || question.correctAnswer === option;
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
      {question.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          <p className="font-semibold mb-1">Explanation</p>
          <p className="leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default function QuestionViewerTab() {
  const [section, setSection] = useState<SectionId>('math');
  const [domain, setDomain] = useState<DomainId>('math-algebra');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [index, setIndex] = useState(0);

  const domains = SECTION_DOMAINS[section];

  const allForDomain = useMemo(() => getQuestionsByDomain(domain), [domain]);

  const questions = useMemo(() => {
    if (difficulty === 'all') return allForDomain;
    return allForDomain.filter((q) => q.difficulty === difficulty);
  }, [allForDomain, difficulty]);

  const question = questions[index] ?? null;

  function handleSectionChange(s: SectionId) {
    setSection(s);
    const newDomain = SECTION_DOMAINS[s][0];
    setDomain(newDomain);
    setIndex(0);
    setDifficulty('all');
  }

  function handleDomainChange(d: DomainId) {
    setDomain(d);
    setIndex(0);
  }

  function handleDifficultyChange(d: Difficulty | 'all') {
    setDifficulty(d);
    setIndex(0);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Section</label>
          <select
            value={section}
            onChange={(e) => handleSectionChange(e.target.value as SectionId)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>{SECTION_NAMES[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Domain</label>
          <select
            value={domain}
            onChange={(e) => handleDomainChange(e.target.value as DomainId)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {domains.map((d) => (
              <option key={d} value={d}>{DOMAIN_NAMES[d]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value as Difficulty | 'all')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <span className="text-sm text-slate-500 pb-2">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Navigation */}
      {questions.length > 0 ? (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px]"
            >
              Prev
            </button>

            <span className="text-sm font-medium text-slate-700 tabular-nums">
              {index + 1} / {questions.length}
            </span>

            <button
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index >= questions.length - 1}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px]"
            >
              Next
            </button>

            {/* Jump input */}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-slate-500">Jump to:</label>
              <input
                type="number"
                min={1}
                max={questions.length}
                value={index + 1}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (n >= 1 && n <= questions.length) setIndex(n - 1);
                }}
                className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Question display */}
          {question && <QuestionCard question={question} />}
        </>
      ) : (
        <p className="text-slate-400 text-sm py-8 text-center">No questions in this selection.</p>
      )}
    </div>
  );
}
