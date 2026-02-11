import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { submitQuestionFlag } from '../services/flagService';

interface FlagQuestionButtonProps {
  questionId: string;
}

export default function FlagQuestionButton({ questionId }: FlagQuestionButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_FLAG_DESCRIPTION_LENGTH = 1000;

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // WCAG 2.1.2 - Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // WCAG 2.4.3 - Focus textarea when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user || !description.trim()) return;
    const trimmed = description.trim().slice(0, MAX_FLAG_DESCRIPTION_LENGTH);
    setSubmitting(true);
    setError(null);
    try {
      await submitQuestionFlag(user.id, questionId, trimmed);
      setSubmitted(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit flag');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <span className="text-xs text-amber-600 font-medium flex items-center gap-1" role="status">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 6l3-3h8l3 3v8l-3 3H6l-3-3V6z" />
        </svg>
        Flagged!
      </span>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Report an issue with this question"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors rounded"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h2V3H3zm4 0v10l4-2 4 2 4-2V3H7z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-72 max-w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-50"
          role="dialog"
          aria-label="Report an issue"
        >
          <label htmlFor={`flag-desc-${questionId}`} className="text-xs font-medium text-slate-700 mb-2 block">
            Report an issue
          </label>
          <textarea
            ref={textareaRef}
            id={`flag-desc-${questionId}`}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_FLAG_DESCRIPTION_LENGTH))}
            placeholder="Describe the issue..."
            rows={3}
            maxLength={MAX_FLAG_DESCRIPTION_LENGTH}
            className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 resize-none
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            aria-required="true"
          />
          <p className="text-xs text-slate-400 mt-0.5 text-right" aria-live="polite">
            {description.length}/{MAX_FLAG_DESCRIPTION_LENGTH}
          </p>
          {error && (
            <p className="text-xs text-red-500 mt-1" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !description.trim()}
              className="px-3 py-1 text-xs bg-amber-500 text-white rounded font-medium
                hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
