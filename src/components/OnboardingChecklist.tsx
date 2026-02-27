import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { getQuestionById } from '../data/questions';

const STEPS = [
  { label: 'Complete the Strategy Guide', key: 'strategy' },
  { label: 'Practice Reading & Writing', key: 'rw', target: 10 },
  { label: 'Practice Math', key: 'math', target: 10 },
  { label: 'Review your Progress page', key: 'progress' },
  { label: 'Try a Timed Module', key: 'timed' },
  { label: 'Take your first Mock Test', key: 'mock' },
] as const;

export default function OnboardingChecklist() {
  const navigate = useNavigate();

  const strategyGuideCompleted = useAppStore((s) => s.strategyGuideCompleted);
  const questionProgress = useAppStore((s) => s.questionProgress);
  const hasVisitedProgress = useAppStore((s) => s.hasVisitedProgress);
  const sessionHistory = useAppStore((s) => s.sessionHistory);
  const mockTestHistory = useAppStore((s) => s.mockTestHistory);
  const onboardingDismissed = useAppStore((s) => s.onboardingDismissed);
  const dismissOnboarding = useAppStore((s) => s.dismissOnboarding);
  const markProgressVisited = useAppStore((s) => s.markProgressVisited);

  // Count RW and Math questions attempted
  const { rwCount, mathCount } = useMemo(() => {
    let rw = 0;
    let math = 0;
    for (const qid of Object.keys(questionProgress)) {
      const qp = questionProgress[qid];
      if (qp.attempts.length === 0) continue;
      const q = getQuestionById(qid);
      if (!q) continue;
      if (q.section === 'reading-writing') rw++;
      else if (q.section === 'math') math++;
    }
    return { rwCount: rw, mathCount: math };
  }, [questionProgress]);

  const hasTimedModule = useMemo(
    () => sessionHistory.some((s) => s.mode === 'timed-module'),
    [sessionHistory],
  );

  const stepComplete = [
    strategyGuideCompleted,
    rwCount >= 10,
    mathCount >= 10,
    hasVisitedProgress,
    hasTimedModule,
    mockTestHistory.length >= 1,
  ];

  const completedCount = stepComplete.filter(Boolean).length;
  const allDone = completedCount === 6;

  if (onboardingDismissed) return null;

  const handleAction = (key: string) => {
    switch (key) {
      case 'strategy':
        navigate('/strategy-guide');
        break;
      case 'rw':
        navigate('/practice', { state: { mode: 'practice', sectionFilter: 'reading-writing' } });
        break;
      case 'math':
        navigate('/practice', { state: { mode: 'practice', sectionFilter: 'math' } });
        break;
      case 'progress':
        markProgressVisited();
        navigate('/progress');
        break;
      case 'timed':
        navigate('/practice', { state: { mode: 'timed-module' } });
        break;
      case 'mock':
        navigate('/mock-test');
        break;
    }
  };

  const actionLabels: Record<string, string> = {
    strategy: 'Open Guide',
    rw: 'Start R&W',
    math: 'Start Math',
    progress: 'View Progress',
    timed: 'Start Module',
    mock: 'Take Test',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-5 sm:p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Getting Started</h2>
        <span className="text-sm font-medium text-slate-500">{completedCount}/6</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-5 overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / 6) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const done = stepComplete[i];
          const progressText =
            step.key === 'rw' ? `${Math.min(rwCount, 10)}/10` :
            step.key === 'math' ? `${Math.min(mathCount, 10)}/10` :
            undefined;

          return (
            <div
              key={step.key}
              className="flex items-center gap-3"
            >
              {/* Circle indicator */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500 border border-slate-300'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              {/* Label + progress */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {step.label}
                </span>
                {progressText && !done && (
                  <span className="ml-2 text-xs text-slate-400">({progressText})</span>
                )}
              </div>

              {/* Action button */}
              {!done && (
                <button
                  onClick={() => handleAction(step.key)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg
                    hover:bg-indigo-100 transition-colors shrink-0 min-h-[32px]"
                >
                  {actionLabels[step.key]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Dismiss button — only when all 6 complete */}
      {allDone && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={dismissOnboarding}
            className="w-full py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg
              hover:bg-emerald-100 transition-colors"
          >
            All done! Dismiss checklist
          </button>
        </div>
      )}
    </div>
  );
}
