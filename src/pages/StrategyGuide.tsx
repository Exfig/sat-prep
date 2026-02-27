import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  STRATEGY_GUIDE_CHAPTERS,
  getSectionById,
  getNextSection,
  getAllSectionIds,
} from '../data/strategyGuideContent';
import StrategyProgressBar from '../components/strategy/StrategyProgressBar';
import StrategyChapterCard from '../components/strategy/StrategyChapterCard';
import StrategyContentView from '../components/strategy/StrategyContentView';
import StrategyQuiz from '../components/strategy/StrategyQuiz';

type PageView = 'overview' | 'reading' | 'quiz';

export default function StrategyGuide() {
  const navigate = useNavigate();
  const completedSections = useAppStore((s) => s.strategyGuideSectionsCompleted);
  const guideCompleted = useAppStore((s) => s.strategyGuideCompleted);
  const completeSection = useAppStore((s) => s.completeStrategySection);
  const completeGuide = useAppStore((s) => s.completeStrategyGuide);
  const addXP = useAppStore((s) => s.addXP);
  const checkAndAwardBadges = useAppStore((s) => s.checkAndAwardBadges);

  const [view, setView] = useState<PageView>('overview');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const allSectionIds = useMemo(() => getAllSectionIds(), []);

  // Find first incomplete section for "continue" functionality
  const firstIncompleteSection = useMemo(() => {
    for (const id of allSectionIds) {
      if (!completedSections.includes(id)) return id;
    }
    return null;
  }, [allSectionIds, completedSections]);

  // Determine which chapter is "current"
  const currentChapterId = useMemo(() => {
    if (firstIncompleteSection) {
      const found = getSectionById(firstIncompleteSection);
      return found?.chapter.id ?? null;
    }
    return null;
  }, [firstIncompleteSection]);

  const activeSection = useMemo(
    () => activeSectionId ? getSectionById(activeSectionId) : null,
    [activeSectionId],
  );

  const handleStartChapter = useCallback((chapterId: string) => {
    const chapter = STRATEGY_GUIDE_CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter) return;

    // Find first incomplete section in this chapter, or start from beginning
    const firstIncomplete = chapter.sections.find((s) => !completedSections.includes(s.id));
    const targetSection = firstIncomplete ?? chapter.sections[0];

    setActiveSectionId(targetSection.id);
    setView('reading');
    window.scrollTo(0, 0);
  }, [completedSections]);

  const handleContinueToQuiz = useCallback(() => {
    setView('quiz');
    window.scrollTo(0, 0);
  }, []);

  const handleQuizComplete = useCallback(() => {
    if (!activeSectionId) return;

    // Mark section as complete
    const wasAlreadyComplete = completedSections.includes(activeSectionId);
    completeSection(activeSectionId);

    // Award XP for section completion
    if (!wasAlreadyComplete) {
      addXP({ amount: 5, reason: 'Strategy section completed', timestamp: Date.now() });
    }

    // Check if this was the last section
    const newCompleted = wasAlreadyComplete
      ? completedSections
      : [...completedSections, activeSectionId];
    const allDone = allSectionIds.every((id) => newCompleted.includes(id));

    if (allDone && !guideCompleted) {
      // Award completion bonus
      addXP({ amount: 25, reason: 'Strategy Guide completed!', timestamp: Date.now() });
      completeGuide();
      checkAndAwardBadges();
      // Navigate to overview to show completion
      setView('overview');
      setActiveSectionId(null);
      window.scrollTo(0, 0);
      return;
    }

    // Move to next section or back to overview
    const next = getNextSection(activeSectionId);
    if (next) {
      setActiveSectionId(next.section.id);
      setView('reading');
      window.scrollTo(0, 0);
    } else {
      setView('overview');
      setActiveSectionId(null);
      window.scrollTo(0, 0);
    }

    checkAndAwardBadges();
  }, [activeSectionId, completedSections, allSectionIds, guideCompleted, completeSection, addXP, completeGuide, checkAndAwardBadges]);

  const handleBackToOverview = useCallback(() => {
    setView('overview');
    setActiveSectionId(null);
    window.scrollTo(0, 0);
  }, []);

  // ──── Reading / Quiz views ────
  if (view !== 'overview' && activeSection) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={handleBackToOverview}
          className="mb-6 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          &larr; Back to Overview
        </button>

        {view === 'reading' ? (
          <StrategyContentView
            chapter={activeSection.chapter}
            section={activeSection.section}
            onContinueToQuiz={handleContinueToQuiz}
          />
        ) : (
          <StrategyQuiz
            chapter={activeSection.chapter}
            section={activeSection.section}
            onComplete={handleQuizComplete}
          />
        )}
      </div>
    );
  }

  // ──── Overview view ────
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back to Dashboard (only if guide completed) */}
      {guideCompleted && (
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          &larr; Back to Dashboard
        </button>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">SAT Strategy Guide</h1>
            <p className="text-slate-600 mb-4">
              {guideCompleted
                ? 'Review test strategies anytime. Tap any chapter to revisit.'
                : 'Complete all chapters to unlock the full app. Learn essential strategies before you start practicing.'}
            </p>
          </div>
          {!guideCompleted && (
            <button
              onClick={() => {
                completeGuide();
                navigate('/dashboard');
              }}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap shrink-0 mt-2"
            >
              Skip for now &rarr;
            </button>
          )}
        </div>
        <StrategyProgressBar completedCount={completedSections.length} />
      </div>

      {/* Completion banner */}
      {guideCompleted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-8 text-center">
          <p className="text-lg font-bold text-emerald-700 mb-1">Strategy Guide Complete!</p>
          <p className="text-sm text-emerald-600">
            You have earned the Strategy Scholar badge and unlocked all app features.
          </p>
        </div>
      )}

      {/* Continue button (for non-completed guide) */}
      {!guideCompleted && firstIncompleteSection && (
        <button
          onClick={() => {
            setActiveSectionId(firstIncompleteSection);
            setView('reading');
            window.scrollTo(0, 0);
          }}
          className="w-full mb-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold
            hover:bg-indigo-700 transition-colors min-h-[48px] shadow-sm"
        >
          {completedSections.length === 0 ? 'Start the Guide' : 'Continue Where You Left Off'}
        </button>
      )}

      {/* Chapter cards */}
      <div className="space-y-4">
        {STRATEGY_GUIDE_CHAPTERS.map((chapter) => (
          <StrategyChapterCard
            key={chapter.id}
            chapter={chapter}
            completedSections={completedSections}
            isCurrent={chapter.id === currentChapterId}
            onStart={() => handleStartChapter(chapter.id)}
          />
        ))}
      </div>
    </div>
  );
}
