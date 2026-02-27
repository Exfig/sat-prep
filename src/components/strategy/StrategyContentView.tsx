import { useState } from 'react';
import type { Section, Chapter } from '../../data/strategyGuideContent';

interface StrategyContentViewProps {
  chapter: Chapter;
  section: Section;
  onContinueToQuiz: () => void;
}

export default function StrategyContentView({
  chapter,
  section,
  onContinueToQuiz,
}: StrategyContentViewProps) {
  const [revealedAnswer, setRevealedAnswer] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <p className="text-sm text-slate-500 mb-2">
        Chapter {chapter.number}: {chapter.title}
      </p>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{section.title}</h2>

      {/* Teaching content */}
      <div className="space-y-4 mb-8">
        {section.content.map((paragraph, i) => (
          <p key={i} className="text-slate-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Example question (if present) */}
      {section.exampleQuestion && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-3">
            Example Question
          </h3>
          <p className="text-slate-700 text-sm italic mb-3">
            {section.exampleQuestion.passage}
          </p>
          <p className="text-slate-800 text-sm font-medium mb-3">
            {section.exampleQuestion.prompt}
          </p>
          <div className="space-y-1.5 mb-4">
            {section.exampleQuestion.options.map((opt, i) => (
              <p
                key={i}
                className={`text-sm px-3 py-1.5 rounded ${
                  revealedAnswer && i === section.exampleQuestion!.correctIndex
                    ? 'bg-green-100 text-green-800 font-medium'
                    : 'text-slate-700'
                }`}
              >
                {opt}
              </p>
            ))}
          </div>
          {!revealedAnswer ? (
            <button
              onClick={() => setRevealedAnswer(true)}
              className="text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
            >
              Show Answer &rarr;
            </button>
          ) : (
            <div className="rounded-lg p-3 bg-green-900/40 border border-green-500/30">
              <p className="text-sm font-semibold text-green-400 mb-1">
                Correct: {section.exampleQuestion.options[section.exampleQuestion.correctIndex]}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {section.exampleQuestion.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Key Points callout */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-8">
        <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-3">
          Key Points
        </h3>
        <ul className="space-y-2">
          {section.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
              <span className="text-indigo-500 mt-0.5 shrink-0">&bull;</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onContinueToQuiz}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold
          hover:bg-indigo-700 transition-colors min-h-[48px]"
      >
        Continue to Quiz ({section.quiz.length} question{section.quiz.length !== 1 ? 's' : ''})
      </button>
    </div>
  );
}
