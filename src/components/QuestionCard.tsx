import { useState } from 'react';
import type { Question } from '../types';
import { DOMAIN_NAMES, SECTION_NAMES } from '../types';
import MultipleChoiceInput from './MultipleChoiceInput';
import PassageViewer from './PassageViewer';
import TableViewer from './TableViewer';
import BarChartViewer from './BarChartViewer';
import GridInInput from './GridInInput';
import StrategyTipBanner from './StrategyTipBanner';
import FlagQuestionButton from './FlagQuestionButton';

interface QuestionCardProps {
  question: Question;
  onAnswer: (answer: string | number) => void;
  disabled: boolean;
  hidePassage?: boolean;
  hideGraphics?: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

export default function QuestionCard({ question, onAnswer, disabled, hidePassage, hideGraphics }: QuestionCardProps) {
  const [selectedMC, setSelectedMC] = useState<string | null>(null);
  const [gridInVal, setGridInVal] = useState('');

  const handleMCSelect = (answer: string) => {
    setSelectedMC(answer);
    onAnswer(answer);
  };

  const handleGridInChange = (val: string) => {
    setGridInVal(val);
    if (val !== '' && val !== '-') {
      onAnswer(val);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6" role="region" aria-label="Question" data-question-content>
      {/* Meta tags */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4" aria-label="Question metadata" role="group">
        <span className="px-2 py-0.5 sm:py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
          {SECTION_NAMES[question.section]}
        </span>
        <span className="px-2 py-0.5 sm:py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
          {DOMAIN_NAMES[question.domain]}
        </span>
        <span className="px-2 py-0.5 sm:py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 max-w-[200px] truncate">
          {question.skill}
        </span>
        <span className={`px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${difficultyColors[question.difficulty]}`}>
          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </span>
        <span className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">{question.id.match(/-cb-([a-f0-9]+)$/)?.[1] ?? question.id}</span>
          <FlagQuestionButton questionId={question.id} />
        </span>
      </div>

      {/* Passage (hidden when shown in side-by-side layout) */}
      {question.passage && !hidePassage && (
        <div className="mb-4" data-tutorial-target="passage">
          <PassageViewer passage={question.passage} />
        </div>
      )}

      {/* Table data (hidden when shown in side-by-side layout) */}
      {question.tableData && !hideGraphics && (
        <div className="mb-4">
          <TableViewer tableData={question.tableData} />
        </div>
      )}

      {/* Bar chart (hidden when shown in side-by-side layout) */}
      {question.barChartData && !hideGraphics && (
        <div className="mb-4 flex justify-center">
          <BarChartViewer data={question.barChartData} />
        </div>
      )}

      {/* Visual asset (graph/diagram) (hidden when shown in side-by-side layout) */}
      {question.visualAsset && !hideGraphics && (
        <div className="mb-4 flex justify-center">
          <img
            src={`${import.meta.env.BASE_URL}${question.visualAsset.src.replace(/^\//, '')}?v=4`}
            alt={question.visualAsset.altText}
            loading="lazy"
            decoding="async"
            style={question.visualAsset?.maxWidth ? { maxWidth: question.visualAsset.maxWidth } : undefined}
            className={`max-w-full ${question.visualAsset?.maxWidth ? '' : 'sm:max-w-sm'} rounded-lg border border-slate-200`}
          />
        </div>
      )}

      {/* Question text */}
      <p className="text-base sm:text-lg font-medium text-slate-800 mb-4 leading-relaxed whitespace-pre-line" data-tutorial-target="question-text">
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
        <div data-tutorial-target="grid-in-input">
          <GridInInput
            value={gridInVal}
            onChange={handleGridInChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
