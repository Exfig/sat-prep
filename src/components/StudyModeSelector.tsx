import type { StudyMode } from '../types';
import { useAppStore } from '../store/useAppStore';
import { getDueCount } from '../utils/sm2';

interface StudyModeSelectorProps {
  onSelectMode: (mode: StudyMode) => void;
}

const modes: { mode: StudyMode; icon: string; title: string; description: string }[] = [
  {
    mode: 'practice',
    icon: '\u270F\uFE0F',
    title: 'Practice',
    description: 'Answer questions at your own pace',
  },
  {
    mode: 'weak-areas',
    icon: '\uD83C\uDFAF',
    title: 'Weak Areas',
    description: 'Focus on skills you struggle with',
  },
  {
    mode: 'domain-review',
    icon: '\uD83D\uDCDA',
    title: 'Domain Review',
    description: 'Focus on specific domains',
  },
  {
    mode: 'timed-module',
    icon: '\u23F1\uFE0F',
    title: 'Timed Module',
    description: 'Simulate a 32-minute SAT module',
  },
  {
    mode: 'mixed-practice',
    icon: '\uD83D\uDD00',
    title: 'Mixed Practice',
    description: 'Random questions weighted toward weak areas',
  },
  {
    mode: 'spaced-review',
    icon: '\uD83D\uDCC5',
    title: 'Spaced Review',
    description: 'Review questions due for repetition',
  },
  {
    mode: 'boss-fight',
    icon: '\u2694\uFE0F',
    title: 'Boss Fight',
    description: 'Challenge your weakest domain',
  },
  {
    mode: 'adaptive-mock-test',
    icon: '\uD83D\uDCCB',
    title: 'Adaptive Mock Test',
    description: 'Complete a full SAT with 4 modules',
  },
];

export default function StudyModeSelector({ onSelectMode }: StudyModeSelectorProps) {
  const questionProgress = useAppStore((s) => s.questionProgress);
  const dueCount = getDueCount(questionProgress);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {modes.map(({ mode, icon, title, description }) => (
        <button
          key={mode}
          onClick={() => onSelectMode(mode)}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 text-left
            hover:border-indigo-300 hover:shadow-md transition-all duration-200 group relative min-h-[44px]"
        >
          <span className="text-2xl sm:text-3xl block mb-2 sm:mb-3">{icon}</span>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors duration-200">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
          {mode === 'spaced-review' && dueCount > 0 && (
            <span className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full" aria-label={`${dueCount} questions due for review`}>
              {dueCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
