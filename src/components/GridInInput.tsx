import { useCallback } from 'react';

interface GridInInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  correctAnswer?: string | number;
}

/** Pattern allowing digits, at most one decimal point, at most one slash, optional leading negative. */
function isValidGridInInput(input: string): boolean {
  if (input === '' || input === '-') return true;
  // Allow: optional negative, then digits with optional decimal OR fraction
  // Fraction: digits/digits (each side may have decimals is not standard, but digits only for fractions)
  // Decimal: digits with at most one dot
  return /^-?(\d+\.?\d*|\d*\.?\d+)(\/(\d+\.?\d*|\d*\.?\d+))?$/.test(input);
}

function normalizeAnswer(val: string | number): string {
  return String(val).trim();
}

function answersMatch(
  userVal: string,
  correctVal: string | number
): boolean {
  const userStr = userVal.trim();
  const correctStr = normalizeAnswer(correctVal);

  // Direct string match
  if (userStr === correctStr) return true;

  // Numeric comparison (handles fraction evaluation, decimal equivalence)
  const userNum = evaluateExpression(userStr);
  const correctNum = evaluateExpression(correctStr);

  if (userNum !== null && correctNum !== null) {
    return Math.abs(userNum - correctNum) < 1e-9;
  }

  return false;
}

function evaluateExpression(expr: string): number | null {
  const trimmed = expr.trim();
  if (trimmed === '') return null;

  // Handle fractions
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length !== 2) return null;
    const num = Number(parts[0]);
    const den = Number(parts[1]);
    if (isNaN(num) || isNaN(den) || den === 0) return null;
    return num / den;
  }

  const num = Number(trimmed);
  return isNaN(num) ? null : num;
}

export default function GridInInput({
  value,
  onChange,
  disabled,
  correctAnswer,
}: GridInInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Allow the field to be cleared
      if (raw === '') {
        onChange('');
        return;
      }
      // Only accept valid partial input characters
      if (/^-?[\d./]*$/.test(raw) && isValidGridInInput(raw)) {
        onChange(raw);
      }
    },
    [onChange]
  );

  // Determine correctness styling when disabled with a correct answer
  let borderClass = 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500';
  let bgClass = 'bg-white';
  let feedbackText: string | null = null;

  if (disabled && correctAnswer !== undefined) {
    const isCorrect = answersMatch(value, correctAnswer);
    if (isCorrect) {
      borderClass = 'border-emerald-500';
      bgClass = 'bg-emerald-50';
      feedbackText = 'Correct';
    } else {
      borderClass = 'border-red-500';
      bgClass = 'bg-red-50';
      feedbackText = `Correct answer: ${normalizeAnswer(correctAnswer)}`;
    }
  }

  return (
    <div className="w-full max-w-xs">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Your Answer
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="e.g. 42, 3.5, 3/4"
        className={`w-full rounded-lg border ${borderClass} ${bgClass} px-4 py-2.5 font-mono text-lg tracking-wide text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-75`}
        autoComplete="off"
        spellCheck={false}
      />
      <p className="mt-1.5 text-xs text-slate-500">
        Enter a number, decimal, or fraction (e.g., 3/4)
      </p>
      {feedbackText && (
        <p
          className={`mt-1.5 text-sm font-medium ${
            disabled && correctAnswer !== undefined && answersMatch(value, correctAnswer)
              ? 'text-emerald-700'
              : 'text-red-700'
          }`}
        >
          {feedbackText}
        </p>
      )}
    </div>
  );
}
