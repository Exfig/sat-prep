import type { QuestProgress } from '../types';

interface QuestProgressBarProps {
  quest: QuestProgress;
  domainName: string;
}

export default function QuestProgressBar({ quest, domainName }: QuestProgressBarProps) {
  const progressPercent = Math.min(
    (quest.questionsAnswered / 20) * 100, // 20 questions per quest
    100
  );

  const milestones = [25, 50, 75, 100];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700">{domainName}</h3>
        {quest.completed ? (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
            Complete!
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {quest.accuracyPercent}% accuracy
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-slate-100 rounded-full overflow-visible mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            quest.completed ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />

        {/* Milestone dots */}
        {milestones.map((milestone) => (
          <div
            key={milestone}
            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white
              ${progressPercent >= milestone ? 'bg-indigo-600' : 'bg-slate-300'}`}
            style={{ left: `${milestone}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}
      </div>

      {!quest.completed && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{quest.questionsAnswered} answered</span>
          <span>{quest.masteryThresholdMet ? 'Mastery met' : 'Mastery pending'}</span>
        </div>
      )}
    </div>
  );
}
