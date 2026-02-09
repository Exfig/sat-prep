import { useState } from 'react';
import type { Question } from '../types';
import { DOMAIN_NAMES, SECTION_NAMES } from '../types';
import MultipleChoiceInput from './MultipleChoiceInput';
import PassageViewer from './PassageViewer';
import GridInInput from './GridInInput';
import StrategyTipBanner from './StrategyTipBanner';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string | number) => void;
  disabled: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

export default function QuestionCard({ question, onAnswer, disabled }: QuestionCardProps) {
  const [selectedMC, setSelectedMC] = useState<string | null>(null);
  const [gridInVal, setGridInVal] = useState('');

  const handleMCSelect = (answer: string) => {
    setSelectedMC(answer);
    onAnswer(answer);
  };

  const handleGridInChange = (val: string) => {
    setGridInVal(val);
    if (val !== '' && val !== '-') {
      onAnswer(Number(val));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Meta tags */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
          {SECTION_NAMES[question.section]}
        </span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
          {DOMAIN_NAMES[question.domain]}
        </span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
          {question.skill}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[question.difficulty]}`}>
          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </span>
      </div>

      {/* Passage */}
      {question.passage && (
        <div className="mb-4">
          <PassageViewer passage={question.passage} />
        </div>
      )}

      {/* Question text */}
      <p className="text-lg font-medium text-slate-800 mb-4 leading-relaxed">
        {question.question}
      </p>

      {/* Formula box */}
      {question.formula && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mb-4 font-mono text-indigo-800 text-sm">
          {question.formula}
        </div>
      )}

      {/* Strategy Tip */}
      {question.strategyTip && (
        <StrategyTipBanner tip={question.strategyTip} />
      )}

      {/* Input area */}
      {question.type === 'multiple-choice' && question.options && (
        <MultipleChoiceInput
          options={question.options}
          selectedAnswer={selectedMC}
          onSelect={handleMCSelect}
          disabled={disabled}
        />
      )}

      {question.type === 'grid-in' && (
        <GridInInput
          value={gridInVal}
          onChange={handleGridInChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}
