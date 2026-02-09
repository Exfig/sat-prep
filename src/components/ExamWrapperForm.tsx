import { useState } from 'react';

type ErrorType = 'sillyMistake' | 'misread' | 'conceptGap' | 'time' | 'distractorTrap';

interface MissedQuestion {
  questionId: string;
  skill: string;
}

interface ExamWrapperFormProps {
  missedQuestions: MissedQuestion[];
  onComplete: (breakdown: {
    sillyMistake: number;
    misread: number;
    conceptGap: number;
    time: number;
    distractorTrap: number;
  }) => void;
}

const errorOptions: { key: ErrorType; label: string }[] = [
  { key: 'sillyMistake', label: 'Silly Mistake' },
  { key: 'misread', label: 'Misread Prompt' },
  { key: 'conceptGap', label: 'Concept Gap' },
  { key: 'time', label: 'Ran Out of Time' },
  { key: 'distractorTrap', label: 'Distractor Trap' },
];

export default function ExamWrapperForm({ missedQuestions, onComplete }: ExamWrapperFormProps) {
  const [selections, setSelections] = useState<Record<string, ErrorType>>({});

  const allSelected = missedQuestions.every((q) => selections[q.questionId] !== undefined);

  const handleSelect = (questionId: string, errorType: ErrorType) => {
    setSelections((prev) => ({ ...prev, [questionId]: errorType }));
  };

  const handleSubmit = () => {
    const breakdown = { sillyMistake: 0, misread: 0, conceptGap: 0, time: 0, distractorTrap: 0 };
    for (const errorType of Object.values(selections)) {
      breakdown[errorType]++;
    }
    onComplete(breakdown);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Exam Wrapper</h3>
      <p className="text-sm text-slate-500 mb-6">
        Categorize each missed question to identify patterns in your errors.
      </p>

      <div className="space-y-4">
        {missedQuestions.map((q) => (
          <div key={q.questionId} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-3">{q.skill}</p>
            <div className="flex flex-wrap gap-2">
              {errorOptions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSelect(q.questionId, key)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors
                    ${
                      selections[q.questionId] === key
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allSelected}
        className="mt-6 w-full py-3 px-4 rounded-lg bg-indigo-500 text-white font-medium
          hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Reflection
      </button>
    </div>
  );
}
