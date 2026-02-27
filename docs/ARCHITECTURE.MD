# SAT Prep App — Architecture Guide

## Overview

A gamified SAT preparation web app built with React 19 + TypeScript + Vite. Deployed as a sub-app under the TopScore.school multi-app umbrella at `/sat-prep/`. Based on the AP Chemistry app (`c:\games\ap-chem`) with ~95% code reuse, adapted for the SAT's 2-section / 8-domain structure.

**Stack**: React 19, TypeScript (strict), Vite 7, Zustand 5, Supabase (Auth + Postgres), Tailwind CSS v4, Framer Motion, date-fns

**Live URL**: https://topscore.school/sat-prep/
**Dev server**: http://localhost:32310/sat-prep/

---

## Data Model

### Sections & Domains

The SAT has 2 sections, each with 4 domains (8 total):

| Section | Domains |
|---------|---------|
| Reading & Writing | Craft & Structure, Information & Ideas, Standard English Conventions, Expression of Ideas |
| Math | Algebra, Advanced Math, Problem-Solving & Data Analysis, Geometry & Trigonometry |

Key types: `SectionId` (`'reading-writing' | 'math'`), `DomainId` (8 string literals prefixed `rw-` or `math-`).

### Question Schema (`src/types.ts:81`)

```ts
interface Question {
  id: string;
  section: SectionId;
  domain: DomainId;
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple-choice' | 'grid-in';
  question: string;
  options?: string[];           // MC choices
  correctAnswer?: string | number;
  explanation: string;
  relatedConcepts: string[];
  formula?: string;
  passage?: PassageData;        // RW passage text
  strategyTip?: string;
  confusableGroup?: string;     // For interleaving
  eiPhase?: 1 | 2 | 3;         // Elaborative interrogation phase
  deepDivePrompt?: DeepDivePrompt;
  hints?: [string, string];     // Progressive hints (max 2)
  visualAsset?: VisualAsset;    // Graph/diagram/table images
  formulaDisplay?: string;      // LaTeX-like display formula
  requiresThinkPeriod?: boolean;
}
```

### Question Bank (`src/data/`)

Questions are stored as static TypeScript arrays across 17 data files:
- 8 original files (5 questions each, 40 total): `rw-craft-and-structure.ts`, `math-algebra.ts`, etc.
- 9 College Board files (~1600 total): `cb-rw-information-and-ideas.ts`, `cb-math-algebra.ts`, etc.

All questions are aggregated in `src/data/questions.ts` which builds O(1) lookup maps at module load time (by id, section, domain, difficulty, type).

### Progress Tracking (`src/types.ts:119`)

```
QuestionProgress {
  questionId, attempts[], masteryLevel (0-3), lastAttempted, sm2: SM2Data
}

Attempt {
  timestamp, correct, userAnswer, sm2Rating?, confidenceRating?,
  hintsUsed?, deepDiveCompleted?, errorCategory?, secondChance...
}
```

**Mastery**: 0-3 based on consecutive correct answers from most recent (3+ = mastered).

---

## State Management

### Zustand Store (`src/store/useAppStore.ts`)

Single global store with **no persist middleware** — state lives in memory and is hydrated from Supabase on login.

**State shape** (~30 fields):
- `userId`, `isHydrated` — auth tracking
- `currentSession` — active study session (mode, questions, index)
- `questionProgress` — Record<questionId, QuestionProgress>
- Gamification: `xp`, `xpHistory`, `earnedBadges`, `sessionsCompleted`, `studyStreak`, `longestStreak`, `streakFreezes`
- Quests: `questProgress` (per-domain), `bossesDefeated`, `sectionQuests`
- Learning tools: `calibrationData`, `deepDivesCompleted`, `examWrappers`
- Settings: `thinkPeriodEnabled`, `metacogEnabled`, `scaffoldingOverrides`
- SAT-specific: `mockTestHistory`, `strategyGuideCompleted`, `strategyGuideSectionsCompleted`

**Key actions**: `startSession`, `submitAnswer`, `rateSM2`, `submitConfidence`, `completeDeepDive`, `endSession`, `addMockTestResult`, `checkAndAwardBadges`, `updateQuestProgress`, `defeatBoss`, `completeStrategySection`

### Optimistic Update Pattern

1. User action triggers Zustand mutation (instant UI update)
2. Sync engine detects state change via `subscribe()`
3. After 1s debounce, writes are flushed to Supabase in parallel batches

---

## Authentication & Multi-User (`src/contexts/AuthContext.tsx`)

- **Provider**: `AuthProvider` wraps the app inside `BrowserRouter`
- **Auth method**: Supabase Auth (email/password)
- **Roles**: `student` (default) | `admin` (from `profiles.role` column)
- **Login flow**: `signIn` → `getSession` → `hydrateUser(userId)` → `loadAllUserData` + `startSyncEngine`
- **Logout flow**: `stopSyncEngine` → `supabase.auth.signOut()` → `clearUserData()`
- **Password recovery**: `onAuthStateChange('PASSWORD_RECOVERY')` → navigate to `/reset-password`
- **Signup extras**: Optional school, grade level, target test date stored in `profiles`

### Route Protection

- `ProtectedRoute`: Redirects unauthenticated users to `/login`
- `StrategyGateRoute`: Redirects to `/strategy-guide` if not completed (auto-completes for existing users with sessions > 0)
- `AdminRoute`: Requires `role === 'admin'`

---

## Database (Supabase)

### Tables (6 + supporting)

| Table | Purpose | Key |
|-------|---------|-----|
| `profiles` | User profile (name, school, grade, target date, role) | `id` (= auth.uid) |
| `user_progress` | Per-question SM2 + mastery data | `(user_id, question_id)` |
| `attempts` | Individual attempt records | auto-id, FK to user |
| `gamification_state` | Single JSONB row per user (XP, badges, streaks, quests, settings) | `id` (= auth.uid) |
| `exam_wrappers` | Post-test reflection entries | auto-id, FK to user |
| `mock_tests` | Full mock test results (score, modules, duration) | auto-id, FK to user |
| `question_flags` | User-reported question issues | auto-id |
| `email_preferences` | Digest/notification settings | `id` (= auth.uid) |
| `activation_tokens` | Single-use purchase activation tokens (Stripe→student handoff) | `token` (unique) |

**RLS**: All tables have row-level security — users can only read/write their own data. `activation_tokens` has RLS enabled with no policies (accessed only via edge functions with service_role key).
**Trigger**: `handle_new_user()` auto-creates `profiles` + `gamification_state` rows on signup.

### Database Service (`src/services/database.ts`)

- `loadAllUserData(userId)` — parallel fetch of all 5 tables, assembles into `UserData`
- `syncGamificationState(userId, data)` — bulk update of the single gamification JSONB row
- `upsertUserProgress(userId, qp)` — upsert one question progress row
- `insertAttempt(userId, qid, attempt, mode)` — append-only attempt log
- `insertExamWrapper`, `insertMockTest` — append-only records
- `loadProfile`, `updateProfile` — profile CRUD
- `exportAllUserData`, `deleteUserAccount` — data export/deletion

### Sync Engine (`src/services/syncEngine.ts`)

- Subscribes to Zustand store changes via `useAppStore.subscribe()`
- Detects diffs: `questionProgress` changes, new attempts, new exam wrappers, new mock tests
- Debounces 1s, then flushes all pending writes in parallel:
  1. Insert new `attempts` rows
  2. Insert new `exam_wrappers` / `mock_tests` rows
  3. Upsert changed `user_progress` rows
  4. Update `gamification_state` (single row with all gamification JSON)

---

## Study Modes

| Mode | Description | Question Selection |
|------|-------------|-------------------|
| `practice` | Free practice with domain/difficulty filters | `selectPracticeQuestions` — prioritizes unattempted |
| `domain-review` | Focus on a single domain | `selectDomainReviewQuestions` — prioritizes low mastery |
| `weak-areas` | Questions from struggling areas | `selectWeakAreaQuestions` — low accuracy/mastery |
| `mixed-practice` | Round-robin across all domains | `selectMixedPracticeQuestions` — balanced domain coverage |
| `spaced-review` | SM2-based review | `selectSpacedReviewQuestions` — due items first |
| `timed-module` | SAT-style timed module (27 RW / 22 Math) | `selectTimedModuleQuestions` — balanced difficulty |
| `boss-fight` | Domain mastery challenge (10 Qs, 80% to pass) | `selectBossFightQuestions` — medium/hard skew |
| `adaptive-mock-test` | Full SAT simulation (4 modules) | `selectModule1/2Questions` — adaptive difficulty |

---

## Gamification System

### XP & Levels (`src/utils/xp.ts`)

10 levels: Test Taker (0) → SAT Champion (5000 XP)

XP sources:
- Correct answer: 10 base * difficulty multiplier (1/1.5/2) + 5 first-attempt bonus + 3 overdue bonus
- Incorrect answer: 2 base * difficulty multiplier
- Grid-in bonus: +3 for correct
- Hint penalty: 1 hint = 60%, 2 hints = 30%, 3+ hints = 0%
- Deep Dive: +8 correct, +2 incorrect
- Calibration: +3 for well-calibrated confidence
- Exam Wrapper: +15
- Mock Test: +25
- Boss Fight: +50

### Badges (`src/utils/badges.ts`)

~35 badge definitions across categories:
- Milestones (first question, 25/100/250 answered)
- Accuracy streaks (10/25 correct in a row)
- Study streaks (3/7/30 days)
- XP thresholds (100/500/1200/5000)
- Session counts (5/25)
- Mastery (1/10/50 mastered)
- Domain completion (8 badges, one per domain)
- Deep Dives (1/10/25)
- Boss Fights (first/all 8)
- Mock Tests (first, 1400+ score)
- Special (Grid Master, Well Calibrated, Strategy Scholar)

### Quests & Boss Fights

**Domain Quests**: Complete when all questions answered + 70% accuracy + 50% mastered.
**Section Quests**: RW complete when all 4 RW domain quests done, Math when all 4 Math done.
**SAT Ready**: Meta-quest — both sections complete.
**Boss Fights**: Unlock when 10+ questions attempted + 50% accuracy in a domain. 10 questions, need 80% to pass. Rewards 50 XP.

---

## Learning Science Features

### SM2 Spaced Repetition (`src/utils/sm2.ts`)

Standard SM-2 algorithm: tracks ease factor, interval, and repetition count per question. Rating < 3 resets progress; rating >= 3 extends interval. Next review date computed via `date-fns`.

### Scaffolding (`src/utils/scaffolding.ts`)

Adaptive support that fades as student improves:
- **Hints**: Available when SM2 ease factor < 2.2 or repetition < 3
- **Formulas**: Auto-shown when domain accuracy < 50%, toggle when > 70%
- **Deep Dive**: Switches from multiple-choice to free-text after 5 correct in domain

### Interleaving (`src/utils/interleaving.ts`)

Hybrid study queues mixing 70% target domain with 30% confusable questions from 18 skill pairs (e.g., "slope-intercept" vs "point-slope"). Ensures no two adjacent questions share the same skill.

### Second Chance (`src/utils/secondChance.ts`)

After incorrect answer, offers a follow-up question from same skill > same confusable group > same domain. XP scales with difficulty.

### Metacognitive Calibration (`src/utils/calibration.ts`)

Tracks confidence-vs-correctness over last 50 attempts. Labels: well-calibrated (60%+), overconfident, underconfident. Awards XP for well-calibrated predictions.

### Exam Wrappers

Post-session reflection categorizing errors: silly mistake, misread, concept gap, time, distractor trap. Awards 15 XP.

### Strategy Tips (`src/utils/strategyTips.ts`)

20 domain-specific test-taking strategies (2-3 per domain). Shown contextually during practice.

### Strategy Guide (Onboarding)

Multi-section interactive guide that must be completed before accessing the main app. Gated via `StrategyGateRoute`. Auto-completes for existing users with sessions > 0.

---

## Mock Test System

### Flow (`src/utils/adaptiveMockTest.ts`)

1. **RW Module 1** (27 Qs, 32 min): Balanced difficulty (30% easy, 50% medium, 20% hard)
2. **RW Module 2** (27 Qs, 32 min): Adaptive — if Module 1 >= 70% → harder pool (10/50/40), else easier (50/40/10)
3. **Break** (10 min optional)
4. **Math Module 1** (22 Qs, 35 min): Same as RW Module 1
5. **Math Module 2** (22 Qs, 35 min): Same adaptive logic

### Scoring (`src/utils/scoreEstimator.ts`)

- **Practice score**: Weighted accuracy per section → linear map to 200-800
- **Mock test score**: Combined module accuracy + Module 2 difficulty adjustment (harder = 1.1x, easier = 0.9x) → 200-800 per section → 400-1600 total

---

## Admin System

### Admin Service (`src/services/adminService.ts`)

Uses Supabase RPC functions:
- `admin_list_users` — all users with XP/streak/sessions
- `admin_question_stats` — per-question accuracy/attempts
- `admin_question_error_breakdown` — error category distribution
- `admin_usage_stats` — aggregate metrics (users, attempts, accuracy by section, mock test averages, active counts)
- `admin_list_flags` / `admin_resolve_flag` — question flag management
- `admin_delete_user` — cascading user deletion

### Admin Page (`src/pages/Admin.tsx`)

Tabs: Accounts, Question Data, Usage Stats, Flagged Questions, Question Viewer

### Question Flagging (`src/services/flagService.ts`)

Users can flag questions with a description. Admins review and resolve flags.

---

## Routing (`src/App.tsx`)

```
BrowserRouter (basename="/sat-prep")
├── /login, /signup, /forgot-password, /reset-password  (public)
├── /thank-you          ThankYou (post-purchase activation flow)
├── /activate/:token    ActivateToken (student claims activation link)
└── /* (ProtectedRoute)
    ├── /strategy-guide  (always accessible)
    └── (StrategyGateRoute — redirects if not completed)
        ├── /           Dashboard
        ├── /practice   Practice (ErrorBoundary)
        ├── /mock-test  MockTest (ErrorBoundary)
        ├── /progress   Progress
        ├── /settings   Settings
        ├── /profile    Profile
        ├── /activity   ActivityLog
        ├── /exam-review ExamReview (ErrorBoundary)
        └── /admin      AdminRoute → Admin
```

All page components are lazy-loaded via `React.lazy()` for code splitting.

---

## Activation Token System (Purchase → Account Handoff)

Enables parents to purchase TopScore via Stripe and securely hand off account activation to their student.

### Flow

```
Stripe Payment → /thank-you?session_id=cs_xxx → create-activation-token edge fn → token created
  Path A: "I'm the student" → signup form → claim-activation-token → dashboard
  Path B: "For my student" → enter email → send-activation-email → student gets link
                            → or copy link → student visits /activate/{token} → signup → claim → dashboard
```

### Edge Functions (`supabase/functions/`)

| Function | JWT Auth | Purpose |
|----------|----------|---------|
| `create-activation-token` | No | Verifies Stripe session, creates token (idempotent) |
| `validate-activation-token` | No | Checks token is valid/unused/not expired (rate-limited) |
| `claim-activation-token` | Yes | Burns token atomically, links to user account |
| `send-activation-email` | No | Sends branded activation email via Resend |

### Frontend Pages

- **ThankYou** (`/thank-you`): Post-purchase page with two paths (student vs parent). Extracts `session_id` from URL, creates activation token.
- **ActivateToken** (`/activate/:token`): Student lands here from email/link. Validates token, shows signup form, claims token on success.

### Security

- 48-char random tokens (astronomically large keyspace)
- Atomic claim via `.eq("status", "unused")` filter on UPDATE (prevents race conditions)
- Rate limiting on validate endpoint (10 req/min per IP)
- `claim_attempts` counter for abuse detection
- All DB access via service_role key (no direct client access)

---

## Build & Deployment

### Vite Config (`vite.config.ts`)

- `base: '/sat-prep/'` — all assets served under this path
- Dev server: port 32310
- Manual chunks: `vendor-react`, `vendor-supabase`, `vendor-ui`, `vendor-date`, `question-data`
- Target: ES2020

### Deployment (Vercel via TopScore orchestrator)

The app is deployed as part of the TopScore multi-app setup:

1. **Orchestrator** (`c:\games\topscore\`) runs `build.js`
2. Build script: `npm run build` in each sibling app, copies output to `dist/<app-name>/`
3. Landing page: `topscore/landing/index.html` at root
4. Deploy: `cd c:\games\topscore && npx vercel@50.15.1 build --prod && npx vercel@50.15.1 deploy --prebuilt --prod`

### TypeScript Config

- Strict mode with `verbatimModuleSyntax` (must use `import type` for type-only imports)
- `noUnusedLocals` / `noUnusedParameters` enabled

---

## Key Utilities Summary

| File | Purpose |
|------|---------|
| `utils/sm2.ts` | SM-2 spaced repetition algorithm |
| `utils/mastery.ts` | Mastery level calculation (0-3 consecutive correct) |
| `utils/xp.ts` | XP rewards, levels, progress calculation |
| `utils/badges.ts` | ~35 badge definitions + check/award logic |
| `utils/questionSelector.ts` | Question selection for all study modes |
| `utils/adaptiveMockTest.ts` | Mock test module selection + adaptive difficulty |
| `utils/scoreEstimator.ts` | SAT score estimation (practice + mock test) |
| `utils/bossFight.ts` | Boss fight eligibility, selection, result checking |
| `utils/interleaving.ts` | Confusable pair interleaving for study queues |
| `utils/secondChance.ts` | Follow-up question selection after incorrect answers |
| `utils/scaffolding.ts` | Adaptive hints/formula/deep-dive visibility |
| `utils/calibration.ts` | Metacognitive calibration scoring |
| `utils/gridIn.ts` | Grid-in answer parsing + evaluation (fractions, tolerance) |
| `utils/strategyTips.ts` | 20 domain-specific strategy tips |
| `utils/stats.ts` | Domain/overall statistics calculation |
| `services/database.ts` | Supabase CRUD operations |
| `services/syncEngine.ts` | Background state → Supabase sync |
| `services/flagService.ts` | Question flagging |
| `services/adminService.ts` | Admin dashboard data access |
| `services/migration.ts` | localStorage → Supabase data migration |
