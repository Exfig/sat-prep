import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getQuestionById } from '../data/questions';
import {
  selectPracticeQuestions,
  selectWeakAreaQuestions,
  selectDomainReviewQuestions,
  selectTimedModuleQuestions,
  selectMixedPracticeQuestions,
  selectSpacedReviewQuestions,
} from '../utils/questionSelector';
import { getLevelForXP } from '../utils/xp';
import { getBossDomain, selectBossFightQuestions, checkBossFightResult } from '../utils/bossFight';
import { shouldShowHints, shouldUseFreeTextDeepDive } from '../utils/scaffolding';
import { selectSecondChanceQuestion } from '../utils/secondChance';
import { evaluateGridIn } from '../utils/gridIn';
import type { StudyMode, DomainId, SectionId, Difficulty, SM2Rating, ConfidenceRating, Question } from '../types';
import { DOMAIN_NAMES, SECTION_NAMES } from '../types';
import QuestionCard from '../components/QuestionCard';
import FeedbackCard from '../components/FeedbackCard';
import DomainFilter from '../components/DomainFilter';
import Timer from '../components/Timer';
import StudyModeSelector from '../components/StudyModeSelector';
import SM2RatingInput from '../components/SM2RatingInput';
import XPToast from '../components/XPToast';
import LevelUpModal from '../components/LevelUpModal';
import BadgeUnlockToast from '../components/BadgeUnlockToast';
import ConfidenceSlider from '../components/ConfidenceSlider';
import HintPanel from '../components/HintPanel';
import ThinkOverlay from '../components/ThinkOverlay';
import DeepDiveCard from '../components/DeepDiveCard';
import BossFightIntro from '../components/BossFightIntro';
import SecondChanceCard from '../components/SecondChanceCard';

// ─── Practice page ───────────────────────────────────────────────────────────

export default function Practice() {
  const location = useLocation();
  const navigate = useNavigate();
  // Granular Zustand selectors — avoid subscribing to entire store
  const currentSession = useAppStore((s) => s.currentSession);
  const questionProgress = useAppStore((s) => s.questionProgress);
  const xp = useAppStore((s) => s.xp);
  const thinkPeriodEnabled = useAppStore((s) => s.thinkPeriodEnabled);
  const metacogEnabled = useAppStore((s) => s.metacogEnabled);
  const scaffoldingOverrides = useAppStore((s) => s.scaffoldingOverrides);
  const startSession = useAppStore((s) => s.startSession);
  const submitAnswer = useAppStore((s) => s.submitAnswer);
  const submitConfidence = useAppStore((s) => s.submitConfidence);
  const rateSM2 = useAppStore((s) => s.rateSM2);
  const completeDeepDive = useAppStore((s) => s.completeDeepDive);
  const submitSecondChance = useAppStore((s) => s.submitSecondChance);
  const defeatBoss = useAppStore((s) => s.defeatBoss);
  const checkAndAwardBadges = useAppStore((s) => s.checkAndAwardBadges);
  const nextQuestion = useAppStore((s) => s.nextQuestion);
  const endSession = useAppStore((s) => s.endSession);
  const updateStreak = useAppStore((s) => s.updateStreak);
  const updateQuestProgress = useAppStore((s) => s.updateQuestProgress);
  const updateSectionQuests = useAppStore((s) => s.updateSectionQuests);

  const [userAnswer, setUserAnswer] = useState<string | number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showSM2Rating, setShowSM2Rating] = useState(false);

  // Flow state
  const [showConfidence, setShowConfidence] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [currentHintLevel, setCurrentHintLevel] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showThinkOverlay, setShowThinkOverlay] = useState(false);

  // Timed module delayed feedback
  const [timedModuleAnswers, setTimedModuleAnswers] = useState<
    Array<{ questionId: string; userAnswer: string | number; correct: boolean }>
  >([]);

  // Boss fight state
  const [showBossIntro, setShowBossIntro] = useState(false);
  const [bossDomain, setBossDomain] = useState<DomainId | null>(null);
  const [bossCorrectCount, setBossCorrectCount] = useState(0);
  const [bossAnsweredCount, setBossAnsweredCount] = useState(0);

  // XP/Level/Badge notification state
  const [xpToast, setXpToast] = useState<{ amount: number; reason: string } | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<ReturnType<typeof getLevelForXP> | null>(null);
  const [badgeToast, setBadgeToast] = useState<{ name: string; icon: string; description: string } | null>(null);
  const [prevXP, setPrevXP] = useState(xp);

  // 2nd Chance state
  const [showSecondChance, setShowSecondChance] = useState(false);
  const [secondChanceQuestion, setSecondChanceQuestion] = useState<Question | null>(null);

  // Domain review filter state
  const [sectionFilter, setSectionFilter] = useState<SectionId | undefined>();
  const [domainFilter, setDomainFilter] = useState<DomainId | undefined>();
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | undefined>();
  const [showDomainFilter, setShowDomainFilter] = useState(false);
  const [showAllModes, setShowAllModes] = useState(false);

  // Handle mode passed via navigation state from Dashboard
  useEffect(() => {
    const state = location.state as { mode?: StudyMode } | null;
    if (state?.mode && !currentSession) {
      if (state.mode === 'domain-review') {
        setShowDomainFilter(true);
      } else {
        handleSelectMode(state.mode);
      }
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const currentQuestion = currentSession
    ? getQuestionById(currentSession.currentQuestionIds[currentSession.currentIndex])
    : undefined;

  // Determine if think overlay should show when question changes
  useEffect(() => {
    if (!currentQuestion || !currentSession || submitted) return;
    const needsThink =
      (currentQuestion.requiresThinkPeriod || currentQuestion.difficulty === 'hard') &&
      thinkPeriodEnabled &&
      currentSession.mode !== 'timed-module' &&
      currentSession.mode !== 'boss-fight';
    if (needsThink) {
      setShowThinkOverlay(true);
    }
  }, [currentQuestion?.id]);

  const isTimedModule = currentSession?.mode === 'timed-module';
  const isBossFight = currentSession?.mode === 'boss-fight';

  const handleAnswer = useCallback((answer: string | number) => {
    setUserAnswer(answer);
  }, []);

  const handleSubmit = useCallback(() => {
    if (userAnswer === null || !currentQuestion || !currentSession) return;

    const prevLevel = getLevelForXP(prevXP);

    let correct = false;
    if (currentQuestion.type === 'grid-in') {
      correct = evaluateGridIn(userAnswer, currentQuestion.correctAnswer ?? 0);
    } else {
      correct = String(userAnswer) === String(currentQuestion.correctAnswer);
    }

    submitAnswer(currentQuestion.id, userAnswer, correct, hintsUsed);
    updateStreak();

    // Check XP gain and show toast
    const newXP = useAppStore.getState().xp;
    const xpGained = newXP - prevXP;
    if (xpGained > 0) {
      setXpToast({ amount: xpGained, reason: correct ? 'Correct!' : 'Attempted' });
    }
    setPrevXP(newXP);

    // Check level up
    const newLevel = getLevelForXP(newXP);
    if (newLevel.level > prevLevel.level) {
      setLevelUpInfo(newLevel);
    }

    // Check badges
    const newBadges = checkAndAwardBadges();
    if (newBadges.length > 0) {
      setBadgeToast({ name: newBadges[0].name, icon: newBadges[0].icon, description: newBadges[0].description });
    }

    // Update quest progress for the question's domain
    if (currentQuestion.domain) {
      updateQuestProgress(currentQuestion.domain);
      updateSectionQuests();
    }

    setIsCorrect(correct);
    setSubmitted(true);

    // Boss fight tracking
    if (isBossFight) {
      setBossAnsweredCount((prev) => prev + 1);
      if (correct) setBossCorrectCount((prev) => prev + 1);
    }

    // Timed module -- delayed feedback, skip confidence/SM2/feedback
    if (isTimedModule) {
      setTimedModuleAnswers((prev) => [
        ...prev,
        { questionId: currentQuestion.id, userAnswer, correct },
      ]);
      return; // Don't show confidence or SM2 -- just "Answer recorded"
    }

    // Normal flow -- show confidence first (if metacog enabled)
    if (metacogEnabled) {
      setShowConfidence(true);
    }
  }, [userAnswer, currentQuestion, currentSession, submitAnswer, updateStreak, prevXP, checkAndAwardBadges, hintsUsed, isTimedModule, isBossFight, metacogEnabled]);

  const handleConfidenceRate = useCallback((rating: ConfidenceRating) => {
    if (currentQuestion) {
      submitConfidence(currentQuestion.id, rating);
    }
    setShowConfidence(false);
    setShowSM2Rating(true);
  }, [currentQuestion, submitConfidence]);

  const handleSM2Rate = useCallback((rating: SM2Rating) => {
    if (currentQuestion) {
      rateSM2(currentQuestion.id, rating);
    }
    setShowSM2Rating(false);
  }, [currentQuestion, rateSM2]);

  const handleDeepDiveComplete = useCallback((correct: boolean) => {
    if (currentQuestion) {
      completeDeepDive(currentQuestion.id, correct);

      // Check XP and badges after deep dive
      const newXP = useAppStore.getState().xp;
      const xpGained = newXP - prevXP;
      if (xpGained > 0) {
        setXpToast({ amount: xpGained, reason: correct ? 'Deep Dive correct!' : 'Deep Dive attempted' });
      }
      setPrevXP(newXP);

      const newBadges = checkAndAwardBadges();
      if (newBadges.length > 0) {
        setBadgeToast({ name: newBadges[0].name, icon: newBadges[0].icon, description: newBadges[0].description });
      }
    }
    setShowDeepDive(false);
  }, [currentQuestion, completeDeepDive, prevXP, checkAndAwardBadges]);

  // 2nd Chance handlers
  const handleStartSecondChance = useCallback(() => {
    if (!currentQuestion || !currentSession) return;
    const scQuestionId = selectSecondChanceQuestion(currentQuestion.id, questionProgress);
    if (scQuestionId) {
      const scQ = getQuestionById(scQuestionId);
      if (scQ) {
        setSecondChanceQuestion(scQ);
        setShowSecondChance(true);
      }
    }
  }, [currentQuestion, currentSession, questionProgress]);

  const handleSecondChanceSubmit = useCallback((correct: boolean) => {
    if (!currentQuestion || !secondChanceQuestion) return;

    submitSecondChance(currentQuestion.id, secondChanceQuestion.id, correct);

    // Show XP toast for correct 2nd chance
    if (correct) {
      const newXP = useAppStore.getState().xp;
      const xpGained = newXP - prevXP;
      if (xpGained > 0) {
        setXpToast({ amount: xpGained, reason: '2nd Chance correct!' });
      }
      setPrevXP(newXP);
    }

    // Auto-dismiss after a short delay so user sees the result
    setTimeout(() => {
      setShowSecondChance(false);
      setSecondChanceQuestion(null);
    }, 2000);
  }, [currentQuestion, secondChanceQuestion, submitSecondChance, prevXP]);

  const handleSecondChanceSkip = useCallback(() => {
    setShowSecondChance(false);
    setSecondChanceQuestion(null);
  }, []);

  // Hint request
  const handleRequestHint = useCallback(() => {
    setCurrentHintLevel((prev) => Math.min(prev + 1, 2));
    setHintsUsed((prev) => prev + 1);
  }, []);

  // Retry after hint (clear answer, keep hints visible)
  const handleRetryAfterHint = useCallback(() => {
    setUserAnswer(null);
  }, []);

  const resetQuestionState = useCallback(() => {
    setUserAnswer(null);
    setSubmitted(false);
    setIsCorrect(false);
    setShowSM2Rating(false);
    setShowConfidence(false);
    setShowDeepDive(false);
    setCurrentHintLevel(0);
    setHintsUsed(0);
    setShowThinkOverlay(false);
    setShowSecondChance(false);
    setSecondChanceQuestion(null);
  }, []);

  const handleNext = useCallback(() => {
    if (!currentSession) return;
    const isLast = currentSession.currentIndex >= currentSession.currentQuestionIds.length - 1;
    if (isLast) {
      // Boss fight end
      if (isBossFight && bossDomain && currentSession) {
        const result = checkBossFightResult(
          currentSession.currentQuestionIds,
          useAppStore.getState().questionProgress,
          currentSession.startedAt,
        );
        if (result.passed) {
          defeatBoss(bossDomain);
        }
      }

      // Timed module -- navigate to exam review
      if (isTimedModule) {
        const sessionTimestamp = currentSession.startedAt;
        endSession();
        resetQuestionState();
        navigate('/exam-review', {
          state: { answers: timedModuleAnswers, sessionTimestamp },
        });
        return;
      }

      endSession();
      resetQuestionState();
      return;
    }
    nextQuestion();
    resetQuestionState();
  }, [currentSession, nextQuestion, endSession, resetQuestionState, isBossFight, isTimedModule, bossDomain, defeatBoss, timedModuleAnswers, navigate]);

  const handleEndSession = useCallback(() => {
    if (!currentSession) return;

    setTimerRunning(false);

    // Boss fight end
    if (isBossFight && bossDomain) {
      const result = checkBossFightResult(
        currentSession.currentQuestionIds,
        useAppStore.getState().questionProgress,
        currentSession.startedAt,
      );
      if (result.passed) {
        defeatBoss(bossDomain);
      }
    }

    // Timed module -- navigate to exam review
    if (isTimedModule) {
      const sessionTimestamp = currentSession.startedAt;
      endSession();
      resetQuestionState();
      setShowDomainFilter(false);
      setTimedModuleAnswers([]);
      setBossDomain(null);
      setBossCorrectCount(0);
      setBossAnsweredCount(0);
      navigate('/exam-review', {
        state: { answers: timedModuleAnswers, sessionTimestamp },
      });
      return;
    }

    endSession();
    resetQuestionState();
    setShowDomainFilter(false);
    setShowAllModes(false);
    setTimedModuleAnswers([]);
    setBossDomain(null);
    setBossCorrectCount(0);
    setBossAnsweredCount(0);
  }, [endSession, resetQuestionState, isBossFight, isTimedModule, bossDomain, defeatBoss, currentSession, timedModuleAnswers, navigate]);

  const handleTimeUp = useCallback(() => {
    setTimerRunning(false);
    handleEndSession();
  }, [handleEndSession]);

  const handleStartPractice = (section: SectionId) => {
    const questionIds = selectPracticeQuestions({ section, progress: questionProgress });
    startSession({ mode: 'practice', sectionFilter: section }, questionIds);
  };

  const handleSelectMode = (mode: StudyMode) => {
    if (mode === 'practice') {
      // Go back to default section picker view
      setShowAllModes(false);
      return;
    }

    if (mode === 'domain-review') {
      setShowDomainFilter(true);
      return;
    }

    // Adaptive mock test goes to its own page
    if (mode === 'adaptive-mock-test') {
      navigate('/mock-test');
      return;
    }

    // Boss fight mode
    if (mode === 'boss-fight') {
      const domain = getBossDomain(questionProgress, useAppStore.getState().bossesDefeated);
      if (!domain) {
        // No weak areas -- nothing to boss fight
        return;
      }
      const questionIds = selectBossFightQuestions(domain, questionProgress);
      setBossDomain(domain);
      setBossCorrectCount(0);
      setBossAnsweredCount(0);
      setShowBossIntro(true);

      // Store question IDs to start after intro
      startSession({ mode: 'boss-fight', domainFilter: domain }, questionIds);
      return;
    }

    let questionIds: string[];
    const session = { mode } as {
      mode: StudyMode;
      timerDuration?: number;
      domainFilter?: DomainId;
      sectionFilter?: SectionId;
      difficultyFilter?: Difficulty;
    };

    switch (mode) {
      case 'weak-areas':
        questionIds = selectWeakAreaQuestions({ progress: questionProgress, count: 20 });
        break;
      case 'timed-module':
        questionIds = selectTimedModuleQuestions({
          section: sectionFilter ?? 'reading-writing',
          progress: questionProgress,
        });
        session.timerDuration = 32;
        break;
      case 'mixed-practice':
        questionIds = selectMixedPracticeQuestions({ progress: questionProgress, count: 20 });
        break;
      case 'spaced-review':
        questionIds = selectSpacedReviewQuestions({ progress: questionProgress });
        break;
      default:
        questionIds = selectPracticeQuestions({ progress: questionProgress });
    }

    startSession(session, questionIds);
    if (mode === 'timed-module') {
      setTimerRunning(true);
      setTimedModuleAnswers([]);
    }
  };

  const handleStartDomainReview = () => {
    const questionIds = domainFilter
      ? selectDomainReviewQuestions({ domain: domainFilter, progress: questionProgress })
      : selectPracticeQuestions({
          section: sectionFilter,
          difficulty: difficultyFilter,
          progress: questionProgress,
        });

    startSession(
      { mode: 'domain-review', domainFilter, sectionFilter, difficultyFilter },
      questionIds,
    );
    setShowDomainFilter(false);
  };

  // Boss fight intro dismiss
  const handleBossIntroBegin = () => {
    setShowBossIntro(false);
  };

  // Keyboard support: Enter to submit OR advance to next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!submitted && userAnswer !== null && !showThinkOverlay) {
          handleSubmit();
        } else if (submitted && !showSM2Rating && !showConfidence && !showDeepDive && !showSecondChance) {
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitted, userAnswer, showSM2Rating, showConfidence, showDeepDive, showSecondChance, showThinkOverlay, handleSubmit, handleNext]);

  // ─── No active session ── show section picker or mode selection ─────────────

  if (!currentSession) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Start a Practice Session</h1>

        {showDomainFilter ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-md">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Select Domain</h2>
            <DomainFilter
              selectedSection={sectionFilter}
              selectedDomain={domainFilter}
              selectedDifficulty={difficultyFilter}
              onSectionChange={setSectionFilter}
              onDomainChange={setDomainFilter}
              onDifficultyChange={setDifficultyFilter}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleStartDomainReview}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium
                  hover:bg-indigo-700 transition-all duration-200 min-h-[44px]"
              >
                Start
              </button>
              <button
                onClick={() => setShowDomainFilter(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium
                  hover:bg-slate-200 transition-all duration-200 min-h-[44px]"
              >
                Back
              </button>
            </div>
          </div>
        ) : showAllModes ? (
          <>
            <StudyModeSelector onSelectMode={handleSelectMode} />
            <button
              onClick={() => setShowAllModes(false)}
              className="mt-4 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium
                hover:bg-slate-200 transition-all duration-200 min-h-[44px]"
            >
              Back
            </button>
          </>
        ) : (
          <>
            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Choose a Section</h2>
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(SECTION_NAMES) as SectionId[]).map((id) => (
                  <button
                    key={id}
                    onClick={() => handleStartPractice(id)}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center
                      hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                  >
                    <span className="text-3xl block mb-2">{id === 'reading-writing' ? '\uD83D\uDCD6' : '\uD83D\uDCCA'}</span>
                    <span className="text-lg font-semibold text-slate-800">{SECTION_NAMES[id]}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowAllModes(true)}
              className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              More study modes...
            </button>
          </>
        )}
      </div>
    );
  }

  // ─── Boss fight intro screen ───────────────────────────────────────────────

  if (showBossIntro && bossDomain) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <BossFightIntro
          domainName={DOMAIN_NAMES[bossDomain]}
          onBegin={handleBossIntroBegin}
        />
      </div>
    );
  }

  const totalQuestions = currentSession.currentQuestionIds.length;
  const currentIdx = currentSession.currentIndex;
  const isLastQuestion = currentIdx >= totalQuestions - 1;

  // No questions available
  if (totalQuestions === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-600 mb-4">No questions available for this selection.</p>
        <button
          onClick={handleEndSession}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium
            hover:bg-indigo-700 transition-all duration-200 min-h-[44px]"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Current question not found (session complete)
  if (!currentQuestion) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">Session Complete!</h2>

        {/* Boss fight result */}
        {isBossFight && bossDomain && (
          <div className="mb-6">
            {bossAnsweredCount > 0 && bossCorrectCount / bossAnsweredCount >= 0.75 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-6 mb-4">
                <p className="text-xl sm:text-2xl font-bold text-emerald-700 mb-2">Victory!</p>
                <p className="text-sm sm:text-base text-slate-600">
                  You scored {bossCorrectCount}/{bossAnsweredCount} and defeated the {DOMAIN_NAMES[bossDomain]} boss!
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 mb-4">
                <p className="text-xl sm:text-2xl font-bold text-red-700 mb-2">Defeated...</p>
                <p className="text-sm sm:text-base text-slate-600">
                  You scored {bossCorrectCount}/{bossAnsweredCount}. You need 75% to win. Keep studying and try again!
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleEndSession}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium
            hover:bg-indigo-700 transition-all duration-200 min-h-[44px]"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ─── Determine hint/scaffolding/deep-dive state ────────────────────────────

  const qProgress = questionProgress[currentQuestion.id];
  const scaffoldOverride = scaffoldingOverrides[currentQuestion.domain];
  const hintsAvailable =
    !isTimedModule &&
    !isBossFight &&
    !!currentQuestion.hints &&
    shouldShowHints(qProgress, scaffoldOverride);

  // Deep dive eligibility (one-time only -- no XP farming)
  const deepDiveEligible =
    !isTimedModule &&
    isCorrect &&
    !!currentQuestion.deepDivePrompt &&
    (currentQuestion.eiPhase ?? 0) >= 2 &&
    !qProgress?.attempts.some((a) => a.deepDiveCompleted);

  // Deep dive free text vs MC
  const useFreeTextDeepDive = currentQuestion.deepDivePrompt
    ? shouldUseFreeTextDeepDive(currentQuestion.domain, questionProgress)
    : false;

  // Determine what to show after submit based on mode
  const showTimedModuleRecorded = isTimedModule && submitted;
  const showFeedbackNow =
    submitted &&
    !isTimedModule &&
    !showConfidence &&
    !showSM2Rating &&
    !showDeepDive &&
    !showSecondChance;

  // 2nd Chance: eligible when wrong and not in timed module or boss fight
  const secondChanceEligible =
    showFeedbackNow &&
    !isCorrect &&
    !isTimedModule &&
    !isBossFight &&
    !qProgress?.attempts[qProgress.attempts.length - 1]?.secondChanceQuestionId;

  // ─── Render active session ─────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Think Overlay */}
      {showThinkOverlay && (
        <ThinkOverlay
          duration={4}
          onComplete={() => setShowThinkOverlay(false)}
        />
      )}

      {/* Top bar: progress + timer + boss score */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
        <span className="text-sm font-medium text-slate-500">
          Q {currentIdx + 1}/{totalQuestions}
        </span>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Boss fight live score */}
          {isBossFight && (
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              {bossCorrectCount}/{bossAnsweredCount}
              {bossAnsweredCount > 0 && (
                <span className={`ml-1 ${bossCorrectCount / bossAnsweredCount >= 0.75 ? 'text-emerald-600' : 'text-red-500'}`}>
                  (need 75%)
                </span>
              )}
            </span>
          )}
          {currentSession.mode === 'timed-module' && currentSession.timerDuration && (
            <Timer
              duration={currentSession.timerDuration * 60}
              onTimeUp={handleTimeUp}
              isRunning={timerRunning}
            />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 bg-slate-200 rounded-full mb-4 sm:mb-6 overflow-hidden"
        role="progressbar"
        aria-valuenow={currentIdx + (submitted ? 1 : 0)}
        aria-valuemin={0}
        aria-valuemax={totalQuestions}
        aria-label={`Question ${currentIdx + 1} of ${totalQuestions}`}
      >
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentIdx + (submitted ? 1 : 0)) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question */}
      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        onAnswer={handleAnswer}
        disabled={submitted || showThinkOverlay}
      />

      {/* Hint Panel (shown before submit, non-timed, non-boss) */}
      {!submitted && hintsAvailable && currentQuestion.hints && (
        <div className="mt-4">
          <HintPanel
            hints={currentQuestion.hints}
            currentHint={currentHintLevel}
            onRequestHint={handleRequestHint}
            onRetry={handleRetryAfterHint}
            hintsAvailable={hintsAvailable}
          />
        </div>
      )}

      {/* Submit button */}
      {!submitted && !showThinkOverlay && (
        <div className="mt-4 sm:mt-6">
          <button
            onClick={handleSubmit}
            disabled={userAnswer === null}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold
              hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed
              transition-all duration-200 min-h-[44px]"
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Timed module -- neutral "Answer recorded" message */}
      {showTimedModuleRecorded && (
        <div className="mt-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
            <p className="text-slate-600 font-medium">Answer recorded</p>
          </div>
        </div>
      )}

      {/* Confidence Slider (shown after submit, before SM2) */}
      {submitted && showConfidence && !isTimedModule && (
        <div className="mt-6">
          <ConfidenceSlider onRate={handleConfidenceRate} />
        </div>
      )}

      {/* SM-2 Rating step (shown after confidence, before feedback) */}
      {submitted && showSM2Rating && !isTimedModule && (
        <div className="mt-6">
          <SM2RatingInput onRate={handleSM2Rate} />
        </div>
      )}

      {/* Feedback */}
      {showFeedbackNow && (
        <div className="mt-6">
          <FeedbackCard
            correct={isCorrect}
            correctAnswer={currentQuestion.correctAnswer ?? ''}
            userAnswer={userAnswer ?? ''}
            explanation={currentQuestion.explanation}
            relatedConcepts={currentQuestion.relatedConcepts}
            formula={currentQuestion.formula}
          />
        </div>
      )}

      {/* 2nd Chance button (shown in feedback phase when wrong, non-timed, non-boss) */}
      {secondChanceEligible && !showSecondChance && (
        <div className="mt-4">
          <button
            onClick={handleStartSecondChance}
            className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold
              hover:bg-amber-600 transition-all duration-200 min-h-[44px]"
          >
            2nd Chance
          </button>
        </div>
      )}

      {/* 2nd Chance Card */}
      {showSecondChance && secondChanceQuestion && (
        <SecondChanceCard
          question={secondChanceQuestion}
          onSubmit={handleSecondChanceSubmit}
          onSkip={handleSecondChanceSkip}
        />
      )}

      {/* Deep Dive button (shown in feedback phase when eligible) */}
      {showFeedbackNow && deepDiveEligible && !showDeepDive && (
        <div className="mt-4">
          <button
            onClick={() => setShowDeepDive(true)}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg font-semibold
              hover:bg-indigo-600 transition-all duration-200"
          >
            Deep Dive
          </button>
        </div>
      )}

      {/* Deep Dive Card */}
      {showDeepDive && currentQuestion.deepDivePrompt && (
        <div className="mt-6">
          <DeepDiveCard
            prompt={currentQuestion.deepDivePrompt}
            useFreeText={useFreeTextDeepDive}
            onComplete={handleDeepDiveComplete}
          />
        </div>
      )}

      {/* Next / End buttons */}
      {submitted && !showSM2Rating && !showConfidence && !showDeepDive && !showSecondChance && (
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
          {!isLastQuestion ? (
            <button
              onClick={handleNext}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold
                hover:bg-indigo-700 transition-all duration-200 min-h-[44px]"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={() => {
                // Boss fight -- show result on end
                if (isBossFight && bossDomain && currentSession) {
                  const result = checkBossFightResult(
                    currentSession.currentQuestionIds,
                    useAppStore.getState().questionProgress,
                    currentSession.startedAt,
                  );
                  if (result.passed) {
                    defeatBoss(bossDomain);
                  }
                }
                if (isTimedModule) {
                  const sessionTimestamp = currentSession.startedAt;
                  endSession();
                  resetQuestionState();
                  navigate('/exam-review', {
                    state: { answers: timedModuleAnswers, sessionTimestamp },
                  });
                  return;
                }
                handleEndSession();
              }}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold
                hover:bg-emerald-700 transition-all duration-200 min-h-[44px]"
            >
              Finish Session
            </button>
          )}
          <button
            onClick={handleEndSession}
            className="w-full sm:w-auto px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium
              hover:bg-slate-200 transition-all duration-200 min-h-[44px]"
          >
            End Session
          </button>
        </div>
      )}

      {/* XP Toast */}
      {xpToast && (
        <XPToast
          amount={xpToast.amount}
          reason={xpToast.reason}
          onDone={() => setXpToast(null)}
        />
      )}

      {/* Level Up Modal */}
      {levelUpInfo && (
        <LevelUpModal
          newLevel={levelUpInfo}
          onClose={() => setLevelUpInfo(null)}
        />
      )}

      {/* Badge Unlock Toast */}
      {badgeToast && (
        <BadgeUnlockToast
          badge={badgeToast}
          onDone={() => setBadgeToast(null)}
        />
      )}
    </div>
  );
}
