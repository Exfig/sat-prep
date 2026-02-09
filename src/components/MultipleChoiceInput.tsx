import { useState, useCallback } from 'react';

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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, option: string) => {
      e.preventDefault();
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

  const isCrossed = (option: string) => crossedOut.has(option);

  const getOptionClasses = (option: string) => {
    const base =
      'flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200 text-left w-full';

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
      return `${base} border-indigo-500 bg-indigo-50 text-indigo-800`;
    }

    if (isCrossed(option)) {
      return `${base} border-slate-200 bg-slate-100 text-slate-400 cursor-pointer`;
    }

    return `${base} border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 cursor-pointer`;
  };

  return (
    <div className="space-y-3">
      {options.map((option, i) => (
        <button
          key={i}
          className={getOptionClasses(option)}
          onClick={() => onSelect(option)}
          onContextMenu={(e) => handleContextMenu(e, option)}
          disabled={disabled}
        >
          <span
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isCrossed(option) && !disabled
                ? 'bg-slate-200 text-slate-400 line-through'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {labels[i]}
          </span>
          <span
            className={`pt-1 ${
              isCrossed(option) && !disabled ? 'line-through opacity-50' : ''
            }`}
          >
            {option}
          </span>
        </button>
      ))}
      {!disabled && (
        <p className="text-xs text-slate-400 mt-1">
          Right-click an option to cross it out
        </p>
      )}
    </div>
  );
}
