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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {modes.map(({ mode, icon, title, description }) => (
        <button
          key={mode}
          onClick={() => onSelectMode(mode)}
          className="group/flip [perspective:1000px] text-left"
        >
          <div className="relative h-44 sm:h-48 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-700 [transform-style:preserve-3d] group-hover/flip:[transform:rotateY(180deg)]">
            {/* Front face */}
            <div className="absolute inset-0 h-full w-full rounded-[inherit] bg-white [backface-visibility:hidden] [transform-style:preserve-3d] [transform:rotateY(0deg)]">
              <div className="[transform:translateZ(70px)_scale(.93)] h-full flex flex-col items-center justify-center p-4">
                <span className="text-4xl sm:text-5xl mb-3">{icon}</span>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 text-center">{title}</h3>
                {mode === 'spaced-review' && dueCount > 0 && (
                  <span className="mt-2 bg-purple-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                    {dueCount} due
                  </span>
                )}
              </div>
            </div>
            {/* Back face */}
            <div className="absolute inset-0 h-full w-full rounded-[inherit] bg-white [backface-visibility:hidden] [transform-style:preserve-3d] [transform:rotateY(180deg)]">
              <div className="[transform:translateZ(70px)_scale(.93)] h-full flex flex-col items-center justify-center p-4 text-center">
                <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">{description}</p>
                <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                  Start &rarr;
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
