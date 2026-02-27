import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  duration: number; // seconds
  onTimeUp: () => void;
  isRunning: boolean;
}

export default function Timer({ duration, onTimeUp, isRunning }: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => { onTimeUpRef.current = onTimeUp; });

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  let colorClass = 'text-slate-700';
  if (remaining < 60) {
    colorClass = 'text-red-600';
  } else if (remaining < 300) {
    colorClass = 'text-amber-600';
  }

  return (
    <div
      className={`font-mono text-2xl font-bold ${colorClass} transition-colors duration-200`}
      role="timer"
      aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
    >
      <span aria-hidden="true">{display}</span>
      {/* Screen reader announcements at key intervals */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {remaining === 300 && '5 minutes remaining'}
        {remaining === 60 && '1 minute remaining'}
        {remaining === 0 && 'Time is up'}
      </span>
    </div>
  );
}
