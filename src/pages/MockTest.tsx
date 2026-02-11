import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { getQuestionById } from '../data/questions';
import { selectModule1Questions, selectModule2Questions, getModule2Difficulty } from '../utils/adaptiveMockTest';
import { estimateScoreFromMockTest } from '../utils/scoreEstimator';
import type { SectionId, ModuleResult, SATScore } from '../types';
import { SECTION_NAMES } from '../types';
import MockTestTimer from '../components/MockTestTimer';
import ScoreEstimator from '../components/ScoreEstimator';
import MultipleChoiceInput from '../components/MultipleChoiceInput';
import GridInInput from '../components/GridInInput';
import PassageViewer from '../components/PassageViewer';
import FlagQuestionButton from '../components/FlagQuestionButton';
import { evaluateGridIn } from '../utils/gridIn';

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'rw-module-1' | 'rw-module-2' | 'break' | 'math-module-1' | 'math-module-2' | 'results';

interface ModuleAnswer {
  questionId: string;
  userAnswer: string | number;
  correct: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getModuleConfig(phase: Phase): { section: SectionId; moduleNumber: 1 | 2; questionCount: number; durationSeconds: number } | null {
  switch (phase) {
    case 'rw-module-1':
      return { section: 'reading-writing', moduleNumber: 1, questionCount: 27, durationSeconds: 32 * 60 };
    case 'rw-module-2':
      return { section: 'reading-writing', moduleNumber: 2, questionCount: 27, durationSeconds: 32 * 60 };
    case 'math-module-1':
      return { section: 'math', moduleNumber: 1, questionCount: 22, durationSeconds: 35 * 60 };
    case 'math-module-2':
      return { section: 'math', moduleNumber: 2, questionCount: 22, durationSeconds: 35 * 60 };
    default:
      return null;
  }
}

function getSectionLabel(phase: Phase): string {
  switch (phase) {
    case 'rw-module-1': return 'Reading & Writing - Module 1';
    case 'rw-module-2': return 'Reading & Writing - Module 2';
    case 'math-module-1': return 'Math - Module 1';
    case 'math-module-2': return 'Math - Module 2';
    default: return '';
  }
}

const BREAK_DURATION_SECONDS = 10 * 60;

// ─── Component ───────────────────────────────────────────────────────────────

export default function MockTest() {
  const navigate = useNavigate();
  const addMockTestResult = useAppStore((s) => s.addMockTestResult);
  const updateSectionQuests = useAppStore((s) => s.updateSectionQuests);

  // Core state
  const [phase, setPhase] = useState<Phase>('intro');
  const [modules, setModules] = useState<ModuleResult[]>([]);
  const [currentQuestionIds, setCurrentQuestionIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ModuleAnswer[]>([]);
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  // Per-question answer state
  const [selectedMC, setSelectedMC] = useState<string | null>(null);
  const [gridInValue, setGridInValue] = useState('');

  // Computed final score (set when results are reached)
  const [finalScore, setFinalScore] = useState<SATScore | null>(null);

  // Timer key forces re-mount when phase changes
  const [timerKey, setTimerKey] = useState(0);

  // ─── Phase transitions ──────────────────────────────────────────────────────

  const beginTest = useCallback(() => {
    const questionIds = selectModule1Questions('reading-writing');
    setCurrentQuestionIds(questionIds);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedMC(null);
    setGridInValue('');
    setStartedAt(Date.now());
    setTimerKey((k) => k + 1);
    setPhase('rw-module-1');
  }, []);


  const handleBreakEnd = useCallback(() => {
    // Start Math Module 1
    const questionIds = selectModule1Questions('math');
    setCurrentQuestionIds(questionIds);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedMC(null);
    setGridInValue('');
    setTimerKey((k) => k + 1);
    setPhase('math-module-1');
  }, []);

  // ─── Question navigation ───────────────────────────────────────────────────

  // Handle the "Next" button press
  const handleNext = useCallback(() => {
    const questionId = currentQuestionIds[currentIndex];
    const question = getQuestionById(questionId);
    if (!question) return;

    let userAnswer: string | number;
    let correct: boolean;

    if (question.type === 'grid-in') {
      userAnswer = gridInValue;
      correct = question.correctAnswer !== undefined
        ? evaluateGridIn(gridInValue, question.correctAnswer)
        : false;
    } else {
      userAnswer = selectedMC ?? '';
      correct = selectedMC === question.correctAnswer;
    }

    const updatedAnswers = [...answers, { questionId, userAnswer, correct }];
    setAnswers(updatedAnswers);

    if (currentIndex + 1 < currentQuestionIds.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedMC(null);
      setGridInValue('');
    } else {
      // Module is complete; build result and transition
      completeModuleWith(updatedAnswers);
    }
  }, [currentIndex, currentQuestionIds, selectedMC, gridInValue, answers]);

  // Complete a module with a specific set of answers (avoids stale closure)
  const completeModuleWith = useCallback((finalAnswers: ModuleAnswer[]) => {
    const config = getModuleConfig(phase);
    if (!config) return;

    const correctCount = finalAnswers.filter((a) => a.correct).length;
    const score = finalAnswers.length > 0
      ? Math.round((correctCount / finalAnswers.length) * 100)
      : 0;

    let difficulty: 'standard' | 'harder' | 'easier' = 'standard';
    if (config.moduleNumber === 2) {
      difficulty = getModule2Difficulty(
        modules.find((m) => m.section === config.section && m.moduleNumber === 1)?.score ?? 0,
      ) as 'harder' | 'easier';
    }

    const moduleResult: ModuleResult = {
      section: config.section,
      moduleNumber: config.moduleNumber,
      questionIds: currentQuestionIds,
      answers: finalAnswers,
      score,
      difficulty,
    };

    const updatedModules = [...modules, moduleResult];
    setModules(updatedModules);

    switch (phase) {
      case 'rw-module-1': {
        const m2Ids = selectModule2Questions('reading-writing', moduleResult);
        setCurrentQuestionIds(m2Ids);
        setCurrentIndex(0);
        setAnswers([]);
        setSelectedMC(null);
        setGridInValue('');
        setTimerKey((k) => k + 1);
        setPhase('rw-module-2');
        break;
      }
      case 'rw-module-2': {
        setTimerKey((k) => k + 1);
        setPhase('break');
        break;
      }
      case 'math-module-1': {
        const m2Ids = selectModule2Questions('math', moduleResult);
        setCurrentQuestionIds(m2Ids);
        setCurrentIndex(0);
        setAnswers([]);
        setSelectedMC(null);
        setGridInValue('');
        setTimerKey((k) => k + 1);
        setPhase('math-module-2');
        break;
      }
      case 'math-module-2': {
        const satScore = estimateScoreFromMockTest(updatedModules);
        setFinalScore(satScore);

        const durationMs = Date.now() - startedAt;
        addMockTestResult({
          timestamp: Date.now(),
          score: satScore,
          modules: updatedModules,
          duration: Math.round(durationMs / 60000),
        });
        updateSectionQuests();

        setPhase('results');
        break;
      }
      default:
        break;
    }
  }, [phase, modules, currentQuestionIds, startedAt, addMockTestResult, updateSectionQuests]);

  // Handle time expiration: auto-submit remaining unanswered questions as blank
  const handleTimeUp = useCallback(() => {
    const config = getModuleConfig(phase);
    if (!config) {
      // If we're on break, move to Math
      if (phase === 'break') {
        handleBreakEnd();
      }
      return;
    }

    // Submit remaining questions with blank answers
    const remaining: ModuleAnswer[] = [];
    for (let i = currentIndex; i < currentQuestionIds.length; i++) {
      const qId = currentQuestionIds[i];
      // Check if this question has already been answered
      if (answers.some((a) => a.questionId === qId)) continue;

      const question = getQuestionById(qId);
      if (!question) continue;

      // For the current question, use whatever answer is in progress
      if (i === currentIndex) {
        let userAnswer: string | number;
        let correct: boolean;
        if (question.type === 'grid-in') {
          userAnswer = gridInValue;
          correct = question.correctAnswer !== undefined
            ? evaluateGridIn(gridInValue, question.correctAnswer)
            : false;
        } else {
          userAnswer = selectedMC ?? '';
          correct = selectedMC === question.correctAnswer;
        }
        remaining.push({ questionId: qId, userAnswer, correct });
      } else {
        // Unanswered questions are marked incorrect
        remaining.push({ questionId: qId, userAnswer: '', correct: false });
      }
    }

    const finalAnswers = [...answers, ...remaining];
    setAnswers(finalAnswers);
    completeModuleWith(finalAnswers);
  }, [phase, currentIndex, currentQuestionIds, answers, selectedMC, gridInValue, handleBreakEnd, completeModuleWith]);

  // ─── Collect all answers across modules for review ──────────────────────────

  const getAllAnswers = useCallback(() => {
    return modules.flatMap((m) =>
      m.answers.map((a) => ({
        questionId: a.questionId,
        userAnswer: a.userAnswer,
        correct: a.correct,
      })),
    );
  }, [modules]);

  // ─── Render phases ──────────────────────────────────────────────────────────

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 text-center">
            Digital SAT Mock Test
          </h1>
          <p className="text-slate-500 text-center mb-6 sm:mb-8 text-sm sm:text-base">
            This test simulates the actual Digital SAT format
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 mb-2">Reading &amp; Writing</h3>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>Module 1: 27 questions, 32 minutes</li>
                <li>Module 2: 27 questions, 32 minutes (adaptive)</li>
              </ul>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-px w-8 bg-slate-300" />
                <span className="text-sm font-medium">10-minute break</span>
                <div className="h-px w-8 bg-slate-300" />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-900 mb-2">Math</h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>Module 1: 22 questions, 35 minutes</li>
                <li>Module 2: 22 questions, 35 minutes (adaptive)</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">How it works:</span> Module 2 adapts to your Module 1 performance.
              A strong Module 1 score unlocks harder Module 2 questions with higher scoring potential.
              There is a 10-minute optional break between the Reading &amp; Writing and Math sections.
            </p>
          </div>

          <button
            onClick={beginTest}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg
              hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Begin Test
          </button>
        </div>
      </div>
    );
  }

  // Break screen
  if (phase === 'break') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Break Time</h2>
          <p className="text-slate-500 mb-6">
            Take a 10-minute break before starting the Math section.
            You can skip the break whenever you're ready.
          </p>

          <div className="mb-6">
            <MockTestTimer
              key={timerKey}
              duration={BREAK_DURATION_SECONDS}
              onTimeUp={handleBreakEnd}
              isRunning={true}
              sectionLabel="Break"
              isBreak={true}
            />
          </div>

          {/* Progress so far */}
          <div className="bg-slate-50 rounded-lg p-4 mt-4">
            <p className="text-sm font-medium text-slate-600 mb-2">Reading &amp; Writing Complete</p>
            {modules
              .filter((m) => m.section === 'reading-writing')
              .map((m) => (
                <p key={`${m.section}-${m.moduleNumber}`} className="text-xs text-slate-500">
                  Module {m.moduleNumber}: {m.answers.filter((a) => a.correct).length}/{m.answers.length} correct ({m.score}%)
                  {m.moduleNumber === 2 && ` - ${m.difficulty} difficulty`}
                </p>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (phase === 'results') {
    const allAnswers = getAllAnswers();

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Test Complete</h1>

        {/* Estimated score */}
        {finalScore && (
          <div className="mb-8">
            <ScoreEstimator score={finalScore} />
          </div>
        )}

        {/* Per-module breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Module Breakdown</h3>
          <div className="space-y-3">
            {modules.map((m) => {
              const correctCount = m.answers.filter((a) => a.correct).length;
              const total = m.answers.length;
              const sectionLabel = SECTION_NAMES[m.section];
              const diffLabel = m.difficulty !== 'standard' ? ` (${m.difficulty})` : '';

              return (
                <div
                  key={`${m.section}-${m.moduleNumber}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {sectionLabel} - Module {m.moduleNumber}
                      <span className="text-xs text-slate-500 ml-1">{diffLabel}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{correctCount}/{total}</p>
                    <p className="text-xs text-slate-500">{m.score}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 text-center">
          <p className="text-sm text-slate-500">
            Total time: {Math.round((Date.now() - startedAt) / 60000)} minutes
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() =>
              navigate('/exam-review', {
                state: {
                  answers: allAnswers,
                  sessionTimestamp: startedAt,
                  modules,
                },
              })
            }
            className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-lg font-medium
              hover:bg-indigo-700 transition-colors"
          >
            Review Answers
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-6 bg-slate-100 text-slate-700 rounded-lg font-medium
              hover:bg-slate-200 transition-colors border border-slate-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Active module (question view) ──────────────────────────────────────────

  const config = getModuleConfig(phase);
  if (!config) return null;

  const currentQuestionId = currentQuestionIds[currentIndex];
  const currentQuestion = currentQuestionId ? getQuestionById(currentQuestionId) : null;

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">No questions available for this module.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium
            hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isLastQuestion = currentIndex === currentQuestionIds.length - 1;
  const hasAnswer = currentQuestion.type === 'grid-in' ? gridInValue.trim() !== '' : selectedMC !== null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
      {/* Timer */}
      <div className="mb-4 sm:mb-6">
        <MockTestTimer
          key={timerKey}
          duration={config.durationSeconds}
          onTimeUp={handleTimeUp}
          isRunning={true}
          sectionLabel={getSectionLabel(phase)}
        />
      </div>

      {/* Question progress */}
      <div className="flex items-center justify-between mb-3 sm:mb-4" aria-live="polite">
        <span className="text-sm font-medium text-slate-600">
          Q {currentIndex + 1}/{currentQuestionIds.length}
        </span>
        <span className="text-xs text-slate-500">
          {SECTION_NAMES[config.section]} <span aria-hidden="true">&middot;</span> Module {config.moduleNumber}
        </span>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6" role="region" aria-label={`Question ${currentIndex + 1}`}>
        {/* Flag button */}
        <div className="flex justify-end mb-2">
          <FlagQuestionButton questionId={currentQuestion.id} />
        </div>

        {/* Passage (if applicable) */}
        {currentQuestion.passage && (
          <div className="mb-4 sm:mb-6">
            <PassageViewer passage={currentQuestion.passage} />
          </div>
        )}

        {/* Visual asset (graph/diagram) */}
        {currentQuestion.visualAsset && (
          <div className="mb-4 flex justify-center">
            <img
              src={currentQuestion.visualAsset.src}
              alt={currentQuestion.visualAsset.altText}
              loading="lazy"
              decoding="async"
              className="max-w-full sm:max-w-sm rounded-lg border border-slate-200"
            />
          </div>
        )}

        {/* Question text */}
        <p className="text-sm sm:text-base font-medium text-slate-800 mb-4 sm:mb-6 leading-relaxed">
          {currentQuestion.question}
        </p>

        {/* Answer input */}
        {currentQuestion.type === 'grid-in' ? (
          <GridInInput
            value={gridInValue}
            onChange={setGridInValue}
            disabled={false}
          />
        ) : currentQuestion.options ? (
          <MultipleChoiceInput
            options={currentQuestion.options}
            selectedAnswer={selectedMC}
            onSelect={setSelectedMC}
            disabled={false}
          />
        ) : null}
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className={`w-full sm:w-auto py-3 px-8 rounded-lg font-medium transition-colors min-h-[44px] ${
            hasAnswer
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
          }`}
        >
          {isLastQuestion ? 'Finish Module' : 'Next'}
        </button>
      </div>
    </div>
  );
}
