import { useState } from 'react';
import type { DeepDivePrompt } from '../types';

interface DeepDiveCardProps {
  prompt: DeepDivePrompt;
  useFreeText: boolean;
  onComplete: (correct: boolean) => void;
}

export default function DeepDiveCard({ prompt, useFreeText, onComplete }: DeepDiveCardProps) {
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [freeText, setFreeText] = useState('');

  const handleMCAnswer = (index: number) => {
    const correct = index === 0;
    setWasCorrect(correct);
    setAnswered(true);
  };

  const handleFreeTextSubmit = () => {
    // Free text is always marked correct (self-assessed)
    setWasCorrect(true);
    setAnswered(true);
  };

  return (
    <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-200 p-6">
      <span className="inline-block text-xs font-bold text-indigo-600 bg-indigo-100 rounded-full px-3 py-1 mb-3">
        Deep Dive
      </span>
      <h3 className="text-sm font-semibold text-indigo-900 mb-4">{prompt.question}</h3>

      {!answered && !useFreeText && prompt.options && (
        <div className="space-y-2">
          {prompt.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleMCAnswer(index)}
              className="w-full text-left py-2.5 px-4 rounded-lg bg-white border border-indigo-200
                text-sm text-indigo-800 hover:bg-indigo-100 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {!answered && useFreeText && (
        <div className="space-y-3">
          <label htmlFor="deep-dive-explanation" className="sr-only">Your explanation</label>
          <textarea
            id="deep-dive-explanation"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Type your explanation..."
            className="w-full h-24 p-3 rounded-lg border border-indigo-200 text-sm
              text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none
              focus:ring-2 focus:ring-indigo-300"
            aria-label="Type your explanation for this deep dive question"
          />
          <button
            onClick={handleFreeTextSubmit}
            disabled={freeText.trim().length === 0}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-500 text-white text-sm
              font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50
              disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      )}

      {answered && (
        <div className="mt-4 space-y-3">
          <div
            className={`p-3 rounded-lg ${wasCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}
          >
            <p className={`text-xs font-semibold mb-1 ${wasCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
              {wasCorrect ? 'Correct!' : 'Not quite'}
            </p>
            <p className="text-sm text-slate-700">{prompt.correctExplanation}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-500 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1">
              {prompt.conceptLink}
            </span>
            <button
              onClick={() => onComplete(wasCorrect)}
              className="py-2 px-4 rounded-lg bg-indigo-500 text-white text-sm
                font-medium hover:bg-indigo-600 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
