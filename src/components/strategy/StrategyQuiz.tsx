import { useState, useCallback } from 'react';
import type { QuizQuestion, Section, Chapter } from '../../data/strategyGuideContent';

interface StrategyQuizProps {
  chapter: Chapter;
  section: Section;
  onComplete: () => void;
}

export default function StrategyQuiz({ chapter, section, onComplete }: StrategyQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const questions = section.quiz;

  // On retry, only show missed questions
  const activeQuestions = retrying
    ? questions.filter((q) => answers[q.id] !== q.correctIndex)
    : questions;

  const allAnswered = activeQuestions.every((q) => answers[q.id] !== undefined);
  const allCorrect = questions.every((q) => answers[q.id] === q.correctIndex);

  const handleSelect = useCallback((qId: string, optionIndex: number) => {
    if (submitted && !retrying) return;
    setAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  }, [submitted, retrying]);

  const handleSubmit = () => {
    setSubmitted(true);
    setRetrying(false);
  };

  const handleRetry = () => {
    // Clear wrong answers only
    const cleared = { ...answers };
    for (const q of questions) {
      if (cleared[q.id] !== q.correctIndex) {
        delete cleared[q.id];
      }
    }
    setAnswers(cleared);
    setSubmitted(false);
    setRetrying(true);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-sm text-slate-500 mb-2">
        Chapter {chapter.number}: {chapter.title}
      </p>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">{section.title} &mdash; Quiz</h2>
      <p className="text-sm text-slate-500 mb-6">
        Answer all questions correctly to complete this section.
      </p>

      <div className="space-y-6 mb-8">
        {activeQuestions.map((q, qi) => (
          <QuizQuestionCard
            key={q.id}
            question={q}
            index={retrying ? qi : questions.indexOf(q)}
            selectedIndex={answers[q.id]}
            submitted={submitted && !retrying}
            onSelect={(idx) => handleSelect(q.id, idx)}
          />
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold
            hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          Submit Answers
        </button>
      ) : allCorrect ? (
        <div className="text-center">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-4">
            <p className="text-lg font-bold text-emerald-700">All correct! Section complete.</p>
          </div>
          <button
            onClick={onComplete}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold
              hover:bg-emerald-700 transition-colors min-h-[48px]"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
            <p className="text-lg font-bold text-amber-700">
              {questions.filter((q) => answers[q.id] === q.correctIndex).length}/{questions.length} correct.
              Review the explanations and try the missed questions again.
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-amber-600 text-white rounded-lg font-semibold
              hover:bg-amber-700 transition-colors min-h-[48px]"
          >
            Retry Missed Questions
          </button>
        </div>
      )}
    </div>
  );
}

function QuizQuestionCard({
  question,
  index,
  selectedIndex,
  submitted,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selectedIndex: number | undefined;
  submitted: boolean;
  onSelect: (idx: number) => void;
}) {
  const isCorrect = selectedIndex === question.correctIndex;

  return (
    <div className={`rounded-xl border p-5 ${
      submitted
        ? isCorrect
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-red-200 bg-red-50'
        : 'border-slate-200 bg-white'
    }`}>
      <p className="font-semibold text-slate-800 mb-3">
        {index + 1}. {question.question}
      </p>
      <div className="space-y-2 mb-3">
        {question.options.map((option, oi) => {
          const isSelected = selectedIndex === oi;
          const isCorrectOption = oi === question.correctIndex;

          let optionClass = 'border-slate-200 bg-white hover:bg-slate-50';
          let textClass = 'text-slate-800';
          if (submitted) {
            if (isCorrectOption) {
              optionClass = 'border-emerald-400 bg-emerald-100';
              textClass = 'text-emerald-900';
            } else if (isSelected && !isCorrectOption) {
              optionClass = 'border-red-400 bg-red-100';
              textClass = 'text-red-900';
            } else {
              optionClass = 'border-slate-200 bg-white opacity-60';
            }
          } else if (isSelected) {
            optionClass = 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200';
          }

          return (
            <button
              key={oi}
              onClick={() => onSelect(oi)}
              disabled={submitted}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm ${textClass} transition-all min-h-[44px] ${optionClass}`}
            >
              <span className="font-semibold text-slate-500 mr-2">
                {String.fromCharCode(65 + oi)}.
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className={`text-sm p-3 rounded-lg ${
          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
        }`}>
          {isCorrect ? 'Correct! ' : 'Incorrect. '}
          {question.explanation}
        </div>
      )}
    </div>
  );
}
