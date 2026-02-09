import { useAppStore } from '../store/useAppStore';
import { calculateOverallStats } from '../utils/stats';
import { getQuestionById } from '../data/questions';
import { DOMAIN_NAMES, SECTION_NAMES, getDomainSection } from '../types';
import type { SectionId } from '../types';
import StatsCard from '../components/StatsCard';
import ProgressBar from '../components/ProgressBar';
import XPBar from '../components/XPBar';
import BadgeGrid from '../components/BadgeGrid';
import { getLevelForXP, getXPToNextLevel } from '../utils/xp';
import { BADGE_DEFINITIONS } from '../utils/badges';

export default function Progress() {
  const { questionProgress, studyStreak, lastStudyDate, xp, earnedBadges, mockTestHistory } = useAppStore();
  const stats = calculateOverallStats(questionProgress, studyStreak, lastStudyDate);
  const level = getLevelForXP(xp);
  const xpToNext = getXPToNextLevel(xp);

  const masteredQuestions = Object.values(questionProgress).filter((p) => p.masteryLevel >= 3);
  const needsReview = Object.values(questionProgress).filter(
    (p) => p.attempts.length > 0 && p.masteryLevel < 2
  );

  // Generate streak calendar (last 30 days)
  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  const activeDates = new Set<string>();
  for (const progress of Object.values(questionProgress)) {
    for (const attempt of progress.attempts) {
      activeDates.add(new Date(attempt.timestamp).toDateString());
    }
  }

  const sections: SectionId[] = ['reading-writing', 'math'];

  const getScoreColor = (total: number): string => {
    if (total >= 1400) return 'text-emerald-600';
    if (total >= 1200) return 'text-blue-600';
    if (total >= 1000) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Your Progress</h1>

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Overall Accuracy"
          value={stats.totalAttempted > 0 ? `${stats.overallAccuracy}%` : '--'}
          icon="🎯"
          color="text-emerald-600"
        />
        <StatsCard
          label="Completed"
          value={`${stats.totalAttempted}/${stats.totalQuestions}`}
          icon="📝"
          color="text-indigo-600"
        />
        <StatsCard
          label="Mastered"
          value={stats.totalMastered}
          icon="⭐"
          color="text-amber-600"
        />
        <StatsCard
          label="Study Streak"
          value={`${studyStreak} day${studyStreak !== 1 ? 's' : ''}`}
          icon="🔥"
          color="text-red-600"
        />
      </div>

      {/* XP Progress */}
      <div className="mb-8">
        <XPBar xp={xp} level={level} xpToNext={xpToNext} />
      </div>

      {/* Badges earned */}
      {earnedBadges.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Badges Earned ({earnedBadges.length}/{BADGE_DEFINITIONS.length})
          </h2>
          <BadgeGrid
            earnedBadges={earnedBadges}
            allDefinitions={BADGE_DEFINITIONS.map((d) => ({
              id: d.id,
              name: d.name,
              description: d.description,
              icon: d.icon,
            }))}
          />
        </div>
      )}

      {/* Domain breakdown grouped by section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Domain Breakdown</h2>
        <div className="space-y-6">
          {sections.map((sectionId) => (
            <div key={sectionId}>
              <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
                {SECTION_NAMES[sectionId]}
              </h3>
              <div className="space-y-4">
                {stats.domainStats
                  .filter((ds) => getDomainSection(ds.domainId) === sectionId)
                  .map((domain) => (
                    <div key={domain.domainId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">
                          {DOMAIN_NAMES[domain.domainId]}
                        </span>
                        <span className="text-xs text-slate-500">
                          {domain.attempted}/{domain.totalQuestions} attempted | {domain.mastered} mastered
                        </span>
                      </div>
                      <ProgressBar
                        value={domain.correct}
                        max={domain.totalQuestions}
                        color={
                          domain.attempted === 0
                            ? 'bg-slate-300'
                            : domain.accuracy < 40
                            ? 'bg-red-500'
                            : domain.accuracy <= 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mock Test Score History */}
      {mockTestHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Mock Test History</h2>
          <div className="space-y-3">
            {mockTestHistory
              .slice()
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((entry, idx) => {
                const date = new Date(entry.timestamp);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">
                        {date.toLocaleDateString()}
                      </span>
                      <span className={`text-lg font-bold ${getScoreColor(entry.score.total)}`}>
                        {entry.score.total}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-600">
                        RW: <span className="font-semibold">{entry.score.readingWriting}</span>
                      </span>
                      <span className="text-slate-600">
                        Math: <span className="font-semibold">{entry.score.math}</span>
                      </span>
                      <span className="text-slate-400">
                        {entry.duration}min
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Mastered vs Needs Review */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-emerald-700 mb-3">
            Mastered ({masteredQuestions.length})
          </h2>
          {masteredQuestions.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No questions mastered yet. Keep practicing!
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {masteredQuestions.map((p) => {
                const q = getQuestionById(p.questionId);
                return q ? (
                  <div key={p.questionId} className="text-sm p-2 bg-emerald-50 rounded-lg text-emerald-700">
                    <span className="font-medium">{q.skill}</span>
                    <span className="text-emerald-500 ml-2">({DOMAIN_NAMES[q.domain]})</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-red-700 mb-3">
            Needs Review ({needsReview.length})
          </h2>
          {needsReview.length === 0 ? (
            <p className="text-slate-500 text-sm">No questions need review right now.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {needsReview.map((p) => {
                const q = getQuestionById(p.questionId);
                return q ? (
                  <div key={p.questionId} className="text-sm p-2 bg-red-50 rounded-lg text-red-700">
                    <span className="font-medium">{q.skill}</span>
                    <span className="text-red-400 ml-2">({DOMAIN_NAMES[q.domain]})</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Study streak calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Study Streak</h2>
        <div className="flex items-center gap-1 flex-wrap">
          {last30Days.map((day) => {
            const isActive = activeDates.has(day.toDateString());
            const isToday = day.toDateString() === today.toDateString();
            return (
              <div
                key={day.toISOString()}
                title={day.toLocaleDateString()}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : isToday
                    ? 'bg-indigo-100 text-indigo-600 border border-indigo-300'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-slate-500 mt-3">
          Current streak: {studyStreak} day{studyStreak !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
