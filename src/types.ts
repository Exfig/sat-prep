export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple-choice' | 'grid-in';

export type SectionId = 'reading-writing' | 'math';

export type DomainId =
  | 'rw-craft-and-structure'
  | 'rw-information-and-ideas'
  | 'rw-standard-english-conventions'
  | 'rw-expression-of-ideas'
  | 'math-algebra'
  | 'math-advanced-math'
  | 'math-problem-solving-data-analysis'
  | 'math-geometry-and-trigonometry';

export const SECTION_NAMES: Record<SectionId, string> = {
  'reading-writing': 'Reading & Writing',
  'math': 'Math',
};

export const DOMAIN_NAMES: Record<DomainId, string> = {
  'rw-craft-and-structure': 'Craft & Structure',
  'rw-information-and-ideas': 'Information & Ideas',
  'rw-standard-english-conventions': 'Standard English Conventions',
  'rw-expression-of-ideas': 'Expression of Ideas',
  'math-algebra': 'Algebra',
  'math-advanced-math': 'Advanced Math',
  'math-problem-solving-data-analysis': 'Problem-Solving & Data Analysis',
  'math-geometry-and-trigonometry': 'Geometry & Trigonometry',
};

export const SECTION_DOMAINS: Record<SectionId, DomainId[]> = {
  'reading-writing': [
    'rw-craft-and-structure',
    'rw-information-and-ideas',
    'rw-standard-english-conventions',
    'rw-expression-of-ideas',
  ],
  'math': [
    'math-algebra',
    'math-advanced-math',
    'math-problem-solving-data-analysis',
    'math-geometry-and-trigonometry',
  ],
};

export function getDomainSection(domainId: DomainId): SectionId {
  if (domainId.startsWith('rw-')) return 'reading-writing';
  return 'math';
}

export const ALL_DOMAIN_IDS: DomainId[] = [
  ...SECTION_DOMAINS['reading-writing'],
  ...SECTION_DOMAINS['math'],
];

// Deep Dive prompt for elaborative interrogation
export interface DeepDivePrompt {
  question: string;
  options?: string[];
  correctExplanation: string;
  conceptLink: string;
}

// Visual asset for dual coding
export interface VisualAsset {
  type: 'graph' | 'diagram' | 'number-line' | 'coordinate-plane' | 'geometric-figure' | 'table';
  src: string;
  altText: string;
  caption?: string;
  maxWidth?: string;
}

// Table data for structured data rendering
export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

// Bar chart data for native column/bar chart rendering
export interface BarChartData {
  title: string;
  yAxisLabel: string;
  bars: { label: string; value: number; color?: string }[];
  yMax?: number;
  yStep?: number;
}

// SAT Reading & Writing passage data
export interface PassageData {
  text: string;
  source?: string;
  lineNumbers?: boolean;
  underlineText?: string | string[]; // exact substring(s) to render underlined
}

export interface Question {
  id: string;
  section: SectionId;
  domain: DomainId;
  skill: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation: string;
  relatedConcepts: string[];
  formula?: string;
  passage?: PassageData;
  strategyTip?: string;

  // v2 additions
  confusableGroup?: string;
  eiPhase?: 1 | 2 | 3;
  deepDivePrompt?: DeepDivePrompt;
  hints?: [string, string];
  visualAsset?: VisualAsset;
  tableData?: TableData;
  barChartData?: BarChartData;
  formulaDisplay?: string;
  requiresThinkPeriod?: boolean;
}

// SM-2 Spaced Repetition
export interface SM2Data {
  easeFactor: number;
  interval: number;
  repetition: number;
  nextReviewDate: string | null;
}

export type SM2Rating = 0 | 1 | 2 | 3 | 4 | 5;
export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;
export type ErrorCategory = 'silly-mistake' | 'misread' | 'concept-gap' | 'time' | 'distractor-trap';

export interface Attempt {
  timestamp: number;
  correct: boolean;
  userAnswer: string | number;
  sm2Rating?: SM2Rating;
  confidenceRating?: ConfidenceRating;
  hintsUsed?: number;
  deepDiveCompleted?: boolean;
  deepDiveCorrect?: boolean;
  errorCategory?: ErrorCategory;
  secondChanceQuestionId?: string;
  secondChanceCorrect?: boolean;
}

export interface QuestionProgress {
  questionId: string;
  attempts: Attempt[];
  masteryLevel: number; // 0-3
  lastAttempted: number;
  sm2: SM2Data;
}

export type StudyMode =
  | 'practice'
  | 'weak-areas'
  | 'domain-review'
  | 'timed-module'
  | 'mixed-practice'
  | 'spaced-review'
  | 'boss-fight'
  | 'adaptive-mock-test'
  | 'tutorial';

export interface StudySession {
  mode: StudyMode;
  domainFilter?: DomainId;
  sectionFilter?: SectionId;
  difficultyFilter?: Difficulty;
  timerDuration?: number; // minutes
}

export interface DomainStats {
  domainId: DomainId;
  totalQuestions: number;
  attempted: number;
  correct: number;
  accuracy: number;
  mastered: number;
}

export interface OverallStats {
  totalQuestions: number;
  totalAttempted: number;
  totalCorrect: number;
  overallAccuracy: number;
  totalMastered: number;
  studyStreak: number;
  lastStudyDate: string | null;
  domainStats: DomainStats[];
}

// Session history
export interface SessionLogEntry {
  timestamp: number;
  mode: StudyMode;
  questionsAnswered: number;
  correctAnswers: number;
  score: number; // 0-100 percentage
}

// Gamification — XP, Levels, Badges
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
}

export interface XPEvent {
  amount: number;
  reason: string;
  timestamp: number;
  questionId?: string;
}

// Quest progress per domain
export interface QuestProgress {
  questionsAnswered: number;
  accuracyPercent: number;
  deepDivesCompleted: number;
  masteryThresholdMet: boolean;
  completed: boolean;
  completedDate?: number;
}

// Section quests: RW complete when 4 RW domains done, Math when 4 Math domains done
export interface SectionQuests {
  readingWritingComplete: boolean;
  mathComplete: boolean;
  satReady: boolean; // meta-quest: both sections complete
}

// Exam wrapper for post-test reflection
export interface ExamWrapperEntry {
  sessionTimestamp: number;
  date: number;
  errorBreakdown: {
    sillyMistake: number;
    misread: number;
    conceptGap: number;
    time: number;
    distractorTrap: number;
  };
}

// Calibration data for metacognitive tracking
export interface CalibrationData {
  recentAttempts: Array<{
    confident: boolean;
    correct: boolean;
    timestamp: number;
  }>;
}

// Mock Test types
export interface ModuleResult {
  section: SectionId;
  moduleNumber: 1 | 2;
  questionIds: string[];
  answers: Array<{
    questionId: string;
    userAnswer: string | number;
    correct: boolean;
  }>;
  score: number; // percentage
  difficulty: 'standard' | 'harder' | 'easier';
}

export interface MockTestState {
  phase: 'rw-module-1' | 'rw-module-2' | 'break' | 'math-module-1' | 'math-module-2' | 'results';
  modules: ModuleResult[];
  startedAt: number;
  breakStartedAt?: number;
}

export interface SATScore {
  readingWriting: number; // 200-800
  math: number; // 200-800
  total: number; // 400-1600
}

export interface MockTestHistoryEntry {
  timestamp: number;
  score: SATScore;
  modules: ModuleResult[];
  duration: number; // minutes
}

// PSAT/NMSQT Score Import
export interface PSATScoreData {
  totalScore: number;
  readingWritingScore: number;
  mathScore: number;
  domainPerformance: Partial<Record<DomainId, { low: number; high: number }>>;
  importedAt: number;
}
