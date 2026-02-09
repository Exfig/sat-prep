import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { calculateOverallStats, getWeakAreas } from '../utils/stats';
import { getQuestionById } from '../data/questions';
import { getDueCount } from '../utils/sm2';
import { getLevelForXP, getXPToNextLevel } from '../utils/xp';
import { calculateCalibration } from '../utils/calibration';
import { getBossDomain } from '../utils/bossFight';
import { estimateScore } from '../utils/scoreEstimator';
import type { StudyMode, DomainId, SectionId } from '../types';
import { DOMAIN_NAMES, ALL_DOMAIN_IDS, getDomainSection } from '../types';
import StatsCard from '../components/StatsCard';
import DomainBreakdownChart from '../components/DomainBreakdownChart';
import SectionToggle from '../components/SectionToggle';
import ScoreEstimator from '../components/ScoreEstimator';
import StudyModeSelector from '../components/StudyModeSelector';
import XPBar from '../components/XPBar';
import ReviewForecast from '../components/ReviewForecast';
import QuestProgressBar from '../components/QuestProgressBar';
import CalibrationGauge from '../components/CalibrationGauge';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    questionProgress, studyStreak, lastStudyDate, hasSeenWelcome, setWelcomeSeen,
    xp, earnedBadges, streakFreezes, questProgress, calibrationData,
    mockTestHistory, sectionQuests,
  } = useAppStore();

  const stats = calculateOverallStats(questionProgress, studyStreak, lastStudyDate);
  const weakAreaIds = getWeakAreas(questionProgress);
  const dueCount = getDueCount(questionProgress);
  const level = getLevelForXP(xp);
  const xpToNext = getXPToNextLevel(xp);
  const calibration = calculateCalibration(calibrationData);
  const bossDomain = getBossDomain(questionProgress, useAppStore.getState().bossesDefeated);
  const estimatedScore = estimateScore(stats.domainStats);

  // Section toggle for domain breakdown view
  const [sectionFilter, setSectionFilter] = useState<SectionId | null>(null);

  const filteredDomainStats = sectionFilter
    ? stats.domainStats.filter((ds) => getDomainSection(ds.domainId) === sectionFilter)
    : stats.domainStats;

  const weakAreaStats = weakAreaIds.slice(0, 3).map((domainId) => {
    const domainStat = stats.domainStats.find((s) => s.domainId === domainId);
    return { domainId, accuracy: domainStat ? domainStat.accuracy : 0 };
  });

  const recentBadges = [...earnedBadges].sort((a, b) => b.earnedAt - a.earnedAt).slice(0, 3);

  // Recent activity: last 10 attempted questions
  const recentActivity = Object.values(questionProgress)
    .filter((qp) => qp.attempts.length > 0)
    .sort((a, b) => b.lastAttempted - a.lastAttempted)
    .slice(0, 10)
    .map((qp) => ({
      questionId: qp.questionId,
      correct: qp.attempts[qp.attempts.length - 1].correct,
      timestamp: qp.lastAttempted,
    }));

  // Last 3 mock tests
  const recentMockTests = [...mockTestHistory]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  const handleSelectMode = (mode: StudyMode) => {
    if (mode === 'adaptive-mock-test') {
      navigate('/mock-test');
      return;
    }
    navigate('/practice', { state: { mode } });
  };

  // Streak-at-risk detection
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isStreakAtRisk =
    now.getHours() >= 18 && lastStudyDate !== todayStr && studyStreak > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome message */}
      {!hasSeenWelcome && (
        <div className="bg-indigo-600 text-white rounded-xl p-6 mb-8 relative">
          <button
            onClick={() => setWelcomeSeen()}
            className="absolute top-4 right-4 text-indigo-200 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold mb-2">Welcome to SAT Prep!</h2>
          <p className="text-indigo-100">
            Master all 2 sections and 8 domains of the SAT with practice questions, timed modules,
            adaptive mock tests, and personalized study recommendations. Start by choosing a study mode below.
          </p>
        </div>
      )}

      {/* Streak-at-risk nudge */}
      {isStreakAtRisk && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-8 flex items-center gap-3">
          <span className="text-2xl">&#9888;&#65039;</span>
          <div>
            <p className="font-semibold text-amber-800">Your streak is at risk!</p>
            <p className="text-sm text-amber-700">
              You haven't studied today and your {studyStreak}-day streak will reset at midnight.
              Start a quick session to keep it going!
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard
          label="Questions Done"
          value={`${stats.totalAttempted}/${stats.totalQuestions}`}
          icon="&#128221;"
          color="text-indigo-600"
        />
        <StatsCard
          label="Accuracy"
          value={stats.totalAttempted > 0 ? `${stats.overallAccuracy}%` : '--'}
          icon="&#127919;"
          color="text-emerald-600"
        />
        <StatsCard
          label="Mastered"
          value={stats.totalMastered}
          icon="&#11088;"
          color="text-amber-600"
        />
        <div className="relative">
          <StatsCard
            label="Study Streak"
            value={`${studyStreak} day${studyStreak !== 1 ? 's' : ''}`}
            icon="&#128293;"
            color="text-red-600"
          />
          {streakFreezes > 0 && (
            <span className="absolute top-2 right-2 text-xs bg-sky-100 text-sky-700 border border-sky-200 rounded-full px-2 py-0.5 font-medium">
              &#129482; {streakFreezes} freeze{streakFreezes !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <StatsCard
          label="Due Today"
          value={dueCount}
          icon="&#128197;"
          color="text-purple-600"
        />
      </div>

      {/* Estimated SAT Score */}
      <div className="mb-8">
        <ScoreEstimator score={estimatedScore} />
      </div>

      {/* Calibration Gauge */}
      {calibration.totalRated >= 10 && (
        <div className="mb-8">
          <CalibrationGauge
            label={calibration.label === 'well-calibrated' ? 'Well calibrated' : calibration.label === 'overconfident' ? 'Overconfident' : 'Underconfident'}
            score={calibration.score}
            wellCalibratedPercent={calibration.wellCalibratedPercent}
            totalRated={calibration.totalRated}
          />
        </div>
      )}

      {/* XP Bar */}
      <div className="mb-8">
        <XPBar xp={xp} level={level} xpToNext={xpToNext} />
      </div>

      {/* Review Forecast */}
      <div className="mb-8">
        <ReviewForecast progress={questionProgress} />
      </div>

      {/* Recent badges */}
      {recentBadges.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Recent Badges</h2>
          <div className="flex gap-4 flex-wrap">
            {recentBadges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{badge.name}</p>
                  <p className="text-xs text-slate-500">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mock Test History */}
      {recentMockTests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Mock Test History</h2>
            <button
              onClick={() => navigate('/mock-test')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Take New Test
            </button>
          </div>
          <div className="space-y-3">
            {recentMockTests.map((test, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {new Date(test.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {test.duration} min &middot; RW: {test.score.readingWriting} &middot; Math: {test.score.math}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{test.score.total}</p>
                  <p className="text-xs text-slate-400">out of 1600</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Quests */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Domain Quests</h2>
        {sectionQuests.satReady && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-center">
            <p className="text-sm font-bold text-emerald-700">SAT Ready! All domain quests complete.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_DOMAIN_IDS.map((domainId) => {
            const quest = questProgress[domainId] ?? {
              questionsAnswered: 0,
              accuracyPercent: 0,
              deepDivesCompleted: 0,
              masteryThresholdMet: false,
              completed: false,
            };
            return (
              <QuestProgressBar
                key={domainId}
                quest={quest}
                domainName={DOMAIN_NAMES[domainId]}
              />
            );
          })}
        </div>
      </div>

      {/* Domain breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Domain Performance</h2>
          <SectionToggle selected={sectionFilter} onChange={setSectionFilter} />
        </div>
        <DomainBreakdownChart domainStats={filteredDomainStats} />
      </div>

      {/* Study mode selector */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Start Studying</h2>
        <StudyModeSelector onSelectMode={handleSelectMode} />
      </div>

      {/* Boss Fight CTA */}
      {bossDomain && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Boss Fight</h2>
              <p className="text-red-100">
                Your weakest area is <span className="font-semibold text-white">{DOMAIN_NAMES[bossDomain]}</span>. Ready to fight?
              </p>
            </div>
            <button
              onClick={() => navigate('/practice', { state: { mode: 'boss-fight' as StudyMode } })}
              className="px-6 py-3 bg-white text-red-600 rounded-lg font-bold
                hover:bg-red-50 transition-colors shadow-sm"
            >
              Challenge the Boss
            </button>
          </div>
        </div>
      )}

      {/* Recommended focus areas */}
      {weakAreaStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Recommended Focus Areas</h2>
          <div className="space-y-2">
            {weakAreaStats.map((area) => (
              <div
                key={area.domainId}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200"
              >
                <span className="font-medium text-slate-700">{DOMAIN_NAMES[area.domainId as DomainId]}</span>
                <span className="text-sm text-amber-700 font-medium">
                  {Math.round(area.accuracy)}% accuracy
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.map((activity, i) => {
              const q = getQuestionById(activity.questionId);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${activity.correct ? 'text-emerald-500' : 'text-red-500'}`}>
                      {activity.correct ? '\u2713' : '\u2717'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{q?.skill ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{q ? DOMAIN_NAMES[q.domain] : ''}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
