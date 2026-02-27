import { useEffect, useRef, useState, useCallback } from 'react';

interface MockTestTimerProps {
  duration: number; // seconds for current module
  onTimeUp: () => void;
  isRunning: boolean;
  sectionLabel: string; // e.g., "Reading & Writing - Module 1"
  isBreak?: boolean; // during 10-minute break
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getTimerColor(remaining: number): string {
  if (remaining <= 60) return 'text-red-600';
  if (remaining <= 300) return 'text-amber-600';
  return 'text-emerald-600';
}

function getTimerBg(remaining: number): string {
  if (remaining <= 60) return 'bg-red-50 border-red-200';
  if (remaining <= 300) return 'bg-amber-50 border-amber-200';
  return 'bg-emerald-50 border-emerald-200';
}

export default function MockTestTimer({
  duration,
  onTimeUp,
  isRunning,
  sectionLabel,
  isBreak = false,
}: MockTestTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep the callback ref up to date
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  });

  // Reset remaining when duration changes (new module)
  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  // Tick logic
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleSkipBreak = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(0);
    onTimeUpRef.current();
  }, []);

  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const timerColor = isBreak ? 'text-indigo-600' : getTimerColor(remaining);
  const timerBg = isBreak ? 'bg-indigo-50 border-indigo-200' : getTimerBg(remaining);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div
      className={`rounded-xl border p-3 sm:p-4 transition-colors ${timerBg}`}
      role="timer"
      aria-label={`${isBreak ? 'Break' : sectionLabel} timer: ${minutes} minutes and ${seconds} seconds remaining`}
      aria-live="off"
    >
      {/* Section / module label */}
      <div className="mb-1 sm:mb-2 text-center">
        {isBreak ? (
          <span className="text-xs sm:text-sm font-semibold text-indigo-700">
            Break Time
          </span>
        ) : (
          <span className="text-xs sm:text-sm font-medium text-slate-600">
            {sectionLabel}
          </span>
        )}
      </div>

      {/* Countdown */}
      <div className={`text-center font-mono text-3xl sm:text-4xl font-bold tracking-wider ${timerColor}`} aria-hidden="true">
        {formatTime(remaining)}
      </div>
      {/* Screen reader announcement (only at key intervals) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {remaining === 300 && '5 minutes remaining'}
        {remaining === 60 && '1 minute remaining'}
        {remaining === 0 && 'Time is up'}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Time remaining">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isBreak ? 'bg-indigo-500' : remaining <= 60 ? 'bg-red-500' : remaining <= 300 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Skip break button */}
      {isBreak && remaining > 0 && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleSkipBreak}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 min-h-[44px]"
          >
            Skip Break
          </button>
        </div>
      )}

      {/* Paused indicator */}
      {!isRunning && remaining > 0 && !isBreak && (
        <p className="mt-2 text-center text-xs font-medium text-slate-500" aria-live="polite">
          Paused
        </p>
      )}
    </div>
  );
}
