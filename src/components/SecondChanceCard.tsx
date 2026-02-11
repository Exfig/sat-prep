import { useState } from 'react';
import type { Question } from '../types';
import MultipleChoiceInput from './MultipleChoiceInput';
import GridInInput from './GridInInput';
import PassageViewer from './PassageViewer';

interface SecondChanceCardProps {
  question: Question;
  onSubmit: (correct: boolean) => void;
  onSkip: () => void;
}

export default function SecondChanceCard({ question, onSubmit, onSkip }: SecondChanceCardProps) {
  const [userAnswer, setUserAnswer] = useState<string | number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [selectedMC, setSelectedMC] = useState<string | null>(null);
  const [gridInVal, setGridInVal] = useState('');

  const handleMCSelect = (answer: string) => {
    setSelectedMC(answer);
    setUserAnswer(answer);
  };

  const handleGridInChange = (val: string) => {
    setGridInVal(val);
    if (val !== '' && val !== '-') {
      setUserAnswer(val);
    }
  };

  const handleSubmit = () => {
    if (userAnswer === null) return;

    let correct = false;
    if (question.type === 'grid-in') {
      correct = Math.abs(Number(userAnswer) - Number(question.correctAnswer)) < 0.01;
    } else {
      correct = String(userAnswer) === String(question.correctAnswer);
    }

    setIsCorrect(correct);
    setSubmitted(true);
    onSubmit(correct);
  };

  return (
    <div className="bg-amber-50 rounded-xl border-2 border-amber-300 p-6 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-600 font-bold text-sm uppercase tracking-wide">2nd Chance</span>
        <span className="text-xs text-amber-500">Same skill, different question</span>
      </div>

      {/* Passage */}
      {question.passage && (
        <div className="mb-4">
          <PassageViewer passage={question.passage} />
        </div>
      )}

      {/* Question text */}
      <p className="text-base font-medium text-slate-800 mb-4 leading-relaxed">
        {question.question}
      </p>

      {/* Formula box */}
      {question.formula && (
        <div className="bg-amber-100 border border-amber-200 rounded-lg px-4 py-3 mb-4 font-mono text-amber-800 text-sm">
          {question.formula}
        </div>
      )}

      {/* Input area */}
      {!submitted && (
        <>
          {question.type === 'multiple-choice' && question.options && (
            <MultipleChoiceInput
              options={question.options}
              selectedAnswer={selectedMC}
              onSelect={handleMCSelect}
              disabled={false}
            />
          )}

          {question.type === 'grid-in' && (
            <GridInInput
              value={gridInVal}
              onChange={handleGridInChange}
              disabled={false}
            />
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={userAnswer === null}
              className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg font-semibold
                hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              Submit
            </button>
            <button
              onClick={onSkip}
              className="px-4 py-2.5 bg-white text-slate-600 rounded-lg font-medium
                border border-slate-200 hover:bg-slate-50 transition-all duration-200"
            >
              Skip
            </button>
          </div>
        </>
      )}

      {/* Result */}
      {submitted && (
        <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`} role="status" aria-live="polite">
          <p className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
            {isCorrect ? 'Correct! Nice recovery.' : 'Not quite. Keep studying this skill.'}
          </p>
          {!isCorrect && question.correctAnswer !== undefined && (
            <p className="text-sm text-slate-600 mt-1">
              Correct answer: {question.correctAnswer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
