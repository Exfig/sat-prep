import { useState, useCallback, useRef } from 'react';

const labels = ['A', 'B', 'C', 'D'];

interface MultipleChoiceInputProps {
  options: string[];
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  disabled: boolean;
  correctAnswer?: string;
}

export default function MultipleChoiceInput({
  options,
  selectedAnswer,
  onSelect,
  disabled,
  correctAnswer,
}: MultipleChoiceInputProps) {
  const [crossedOut, setCrossedOut] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const toggleCrossOut = useCallback(
    (option: string) => {
      if (disabled) return;
      setCrossedOut((prev) => {
        const next = new Set(prev);
        if (next.has(option)) {
          next.delete(option);
        } else {
          next.add(option);
        }
        return next;
      });
    },
    [disabled],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, option: string) => {
      e.preventDefault();
      toggleCrossOut(option);
    },
    [toggleCrossOut],
  );

  // Long-press for touch devices to cross out
  const handleTouchStart = useCallback(
    (option: string) => {
      longPressTriggered.current = false;
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        toggleCrossOut(option);
      }, 500);
    },
    [toggleCrossOut],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(
    (option: string) => {
      // Skip selection if long-press just triggered (cross-out)
      if (longPressTriggered.current) {
        longPressTriggered.current = false;
        return;
      }
      onSelect(option);
    },
    [onSelect],
  );

  const isCrossed = (option: string) => crossedOut.has(option);

  const getOptionClasses = (option: string) => {
    const base =
      'flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left w-full min-h-[44px]';

    if (disabled && correctAnswer !== undefined) {
      if (option === correctAnswer) {
        return `${base} border-emerald-500 bg-emerald-50 text-emerald-800`;
      }
      if (option === selectedAnswer && option !== correctAnswer) {
        return `${base} border-red-500 bg-red-50 text-red-800`;
      }
      return `${base} border-slate-200 bg-slate-50 text-slate-400`;
    }

    if (option === selectedAnswer) {
      return `${base} border-indigo-500 bg-indigo-50 text-indigo-700`;
    }

    if (isCrossed(option)) {
      return `${base} border-slate-200 bg-slate-100 text-slate-400 cursor-pointer`;
    }

    return `${base} border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 cursor-pointer`;
  };

  // WCAG 1.3.1 - Use radiogroup role for answer selection
  const showingResults = disabled && correctAnswer !== undefined;

  return (
    <div
      className="space-y-2 sm:space-y-3"
      role={showingResults ? 'list' : 'radiogroup'}
      aria-label="Answer choices"
    >
      {options.map((option, i) => (
        <button
          key={i}
          className={getOptionClasses(option)}
          onClick={() => handleClick(option)}
          onContextMenu={(e) => handleContextMenu(e, option)}
          onTouchStart={() => handleTouchStart(option)}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          disabled={disabled}
          role={showingResults ? 'listitem' : 'radio'}
          aria-checked={showingResults ? undefined : option === selectedAnswer}
          aria-label={`Option ${labels[i]}: ${option}${
            showingResults && option === correctAnswer ? ' (correct answer)' : ''
          }${
            showingResults && option === selectedAnswer && option !== correctAnswer ? ' (your answer, incorrect)' : ''
          }${
            isCrossed(option) && !disabled ? ' (crossed out)' : ''
          }`}
        >
          <span
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isCrossed(option) && !disabled
                ? 'bg-slate-200 text-slate-400 line-through'
                : 'bg-slate-100 text-slate-600'
            }`}
            aria-hidden="true"
          >
            {labels[i]}
          </span>
          <span
            className={`pt-0.5 sm:pt-1 text-sm sm:text-base ${
              isCrossed(option) && !disabled ? 'line-through opacity-50' : ''
            }`}
          >
            {option}
          </span>
        </button>
      ))}
      {!disabled && (
        <p className="text-xs text-slate-500 mt-1" aria-hidden="true">
          <span className="hidden sm:inline">Right-click</span>
          <span className="sm:hidden">Long-press</span>
          {' '}an option to cross it out
        </p>
      )}
    </div>
  );
}
