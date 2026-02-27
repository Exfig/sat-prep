import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getQuestionById } from '../data/questions';
import { DOMAIN_NAMES } from '../types';
import type { DomainId, ModuleResult } from '../types';
import { estimateScoreFromMockTest } from '../utils/scoreEstimator';
import ScoreEstimator from '../components/ScoreEstimator';

type ErrorType = 'sillyMistake' | 'misread' | 'conceptGap' | 'time' | 'distractorTrap';

const errorOptions: { key: ErrorType; label: string; tooltip: string }[] = [
  { key: 'sillyMistake', label: 'Silly Mistake', tooltip: 'You knew the concept but made a careless error (arithmetic, sign, bubbling)' },
  { key: 'misread', label: 'Misread Prompt', tooltip: 'You misunderstood or overlooked key words in the question' },
  { key: 'conceptGap', label: 'Concept Gap', tooltip: "You didn't know the concept or method needed to solve this" },
  { key: 'time', label: 'Ran Out of Time', tooltip: "You didn't have enough time to finish or fully work through this question" },
  { key: 'distractorTrap', label: 'Distractor Trap', tooltip: 'You were lured by an answer choice designed to look correct' },
];

interface ExamAnswer {
  questionId: string;
  userAnswer: string | number;
  correct: boolean;
}

interface ExamReviewState {
  answers: ExamAnswer[];
  sessionTimestamp: number;
  modules?: ModuleResult[];
}

export default function ExamReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const submitExamWrapper = useAppStore((s) => s.submitExamWrapper);
  const [selections, setSelections] = useState<Record<string, ErrorType>>({});

  const state = location.state as ExamReviewState | null;

  if (!state || !state.answers) {
    navigate('/', { replace: true });
    return null;
  }

  const { answers, sessionTimestamp, modules } = state;
  const correctCount = answers.filter((a) => a.correct).length;
  const totalCount = answers.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const missedAnswers = answers.filter((a) => !a.correct);

  // Estimate SAT score if module results are available (mock test review)
  const estimatedScore = modules ? estimateScoreFromMockTest(modules) : null;

  const handleWrapperComplete = (breakdown: {
    sillyMistake: number;
    misread: number;
    conceptGap: number;
    time: number;
    distractorTrap: number;
  }) => {
    submitExamWrapper({
      sessionTimestamp,
      date: Date.now(),
      errorBreakdown: breakdown,
    });
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Exam Review</h1>

      {/* Estimated SAT score (from mock test) */}
      {estimatedScore && (
        <div className="mb-8">
          <ScoreEstimator score={estimatedScore} />
        </div>
      )}

      {/* Score summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 text-center" role="region" aria-label="Score summary">
        <p className="text-4xl font-bold text-slate-800 mb-1" aria-label={`${correctCount} correct out of ${totalCount}`}>
          {correctCount}/{totalCount}
        </p>
        <p className="text-lg text-slate-600">{percentage}% correct</p>
        <div
          className="mt-3 h-3 bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Score: ${percentage}% correct`}
        >
          <div
            className={`h-full rounded-full transition-all ${
              percentage >= 70 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Missed questions review */}
      {missedAnswers.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Missed Questions ({missedAnswers.length})
          </h2>
          <div className="space-y-4 mb-8">
            {missedAnswers.map((answer, i) => {
              const question = getQuestionById(answer.questionId);
              if (!question) return null;

              const correctAnswer = question.correctAnswer ?? '';
              const userAnswerDisplay =
                question.options && typeof answer.userAnswer === 'number'
                  ? question.options[answer.userAnswer]
                  : String(answer.userAnswer);
              const correctAnswerDisplay =
                question.options && typeof correctAnswer === 'number'
                  ? question.options[correctAnswer]
                  : String(correctAnswer);

              return (
                <div
                  key={answer.questionId}
                  className="bg-white rounded-xl shadow-sm border border-red-200 p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-red-100 text-red-700">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 mb-1">
                        {DOMAIN_NAMES[question.domain as DomainId]}
                      </p>
                      <p className="text-sm font-medium text-slate-800">{question.question}</p>
                    </div>
                  </div>

                  <div className="ml-11 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700">
                        Your answer
                      </span>
                      <span className="text-sm text-slate-700">{userAnswerDisplay}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        Correct
                      </span>
                      <span className="text-sm text-slate-700">{correctAnswerDisplay}</span>
                    </div>

                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mt-2">
                      {question.explanation}
                    </p>

                    {/* Inline error categorization */}
                    <div className="pt-2">
                      <p className="text-xs font-medium text-slate-500 mb-2">What went wrong?</p>
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2" role="radiogroup" aria-label={`Error type for question ${i + 1}`}>
                        {errorOptions.map(({ key, label, tooltip }) => (
                          <div key={key} className="relative group">
                            <button
                              onClick={() => setSelections((prev) => ({ ...prev, [answer.questionId]: key }))}
                              role="radio"
                              aria-checked={selections[answer.questionId] === key}
                              className={`w-full py-2 sm:py-1.5 px-3 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                                selections[answer.questionId] === key
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {label}
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg w-56 text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-10" style={{ backgroundColor: '#1e293b', color: '#ffffff', fontSize: '12px' }}>
                              {tooltip}
                              <div className="absolute top-full left-1/2 -translate-x-1/2" style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: '#1e293b transparent transparent transparent' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit reflection */}
          <div className="text-center">
            <button
              onClick={() => {
                const breakdown = { sillyMistake: 0, misread: 0, conceptGap: 0, time: 0, distractorTrap: 0 };
                for (const errorType of Object.values(selections)) {
                  breakdown[errorType]++;
                }
                handleWrapperComplete(breakdown);
              }}
              disabled={!missedAnswers.every((a) => selections[a.questionId] !== undefined)}
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium
                hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Reflection
            </button>
          </div>
        </>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <p className="text-3xl mb-2">&#127881;</p>
          <h2 className="text-xl font-bold text-emerald-800 mb-2">Perfect Score!</h2>
          <p className="text-sm text-emerald-600 mb-4">You got every question right. Great job!</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium
              hover:bg-emerald-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
