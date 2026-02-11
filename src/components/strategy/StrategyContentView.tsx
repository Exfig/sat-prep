import type { Section, Chapter } from '../../data/strategyGuideContent';

interface StrategyContentViewProps {
  chapter: Chapter;
  section: Section;
  onContinueToQuiz: () => void;
}

export default function StrategyContentView({
  chapter,
  section,
  onContinueToQuiz,
}: StrategyContentViewProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <p className="text-sm text-slate-500 mb-2">
        Chapter {chapter.number}: {chapter.title}
      </p>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{section.title}</h2>

      {/* Teaching content */}
      <div className="space-y-4 mb-8">
        {section.content.map((paragraph, i) => (
          <p key={i} className="text-slate-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Key Points callout */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-8">
        <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-3">
          Key Points
        </h3>
        <ul className="space-y-2">
          {section.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
              <span className="text-indigo-500 mt-0.5 shrink-0">&bull;</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onContinueToQuiz}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold
          hover:bg-indigo-700 transition-colors min-h-[48px]"
      >
        Continue to Quiz ({section.quiz.length} question{section.quiz.length !== 1 ? 's' : ''})
      </button>
    </div>
  );
}
