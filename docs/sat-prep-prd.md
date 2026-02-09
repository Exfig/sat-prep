# SAT Study App — Product Requirements Document

## Enhancement Theme: Cognitive Acceleration & Gamification for Digital SAT Mastery

This PRD defines the features, architecture, and implementation tasks needed to build a gamified, research-backed SAT study app. The app reuses the same cognitive acceleration engine developed for the AP Chemistry app — SM-2 spaced repetition, strategic interleaving, metacognitive calibration, adaptive scaffolding, and full gamification — but adapts the content layer, question formats, and domain structure to mirror the Digital SAT exam.

---

## 1. Overview

A web-based study application to help high school students prepare for the Digital SAT exam through adaptive practice questions that mimic the actual exam format, structure, and adaptive difficulty.

### 1.1 Target User

- High school student preparing for the Digital SAT (2 months out)
- Needs focused practice on weak content domains
- Benefits from exam-format familiarity, especially the adaptive module structure
- Already engaged with the AP Chemistry app's gamification model

### 1.2 Digital SAT Format Reference

| Component | Detail |
|-----------|--------|
| Total Duration | 2 hours 14 minutes |
| Sections | 2: Reading & Writing (RW), Math |
| Modules per Section | 2 (adaptive: Module 2 difficulty depends on Module 1 performance) |
| RW Questions | 54 total (27 per module, 32 min per module) |
| Math Questions | 44 total (22 per module, 35 min per module) |
| RW Question Type | Multiple choice (4 options), short passages (25–150 words) |
| Math Question Types | ~75% multiple choice, ~25% student-produced response (grid-in) |
| Scoring | 400–1600 total (200–800 per section) |
| Calculator | Allowed for entire Math section (Desmos built-in) |
| Negative Marking | None |

---

## 2. Goals

1. **Increase learning effectiveness** by integrating SM-2 spaced repetition, strategic interleaving of confusable SAT concepts, dual coding with visual aids, elaborative interrogation, and metacognitive calibration.
2. **Increase engagement and consistency** by layering the same gamification system (XP/levels, streaks, quests, boss fights, confidence rewards) so that daily practice feels like progress in a game.
3. **Build exam readiness** through adaptive module simulation, timed practice mirroring the exact SAT structure, and scaffolding that fades as mastery grows.
4. **Build learner autonomy** through metacognitive tools that teach the student *how* to approach SAT questions strategically, not just *what* the content is.

---

## 3. Content Domains & Question Distribution

### 3.1 Reading & Writing Domains

| Domain | % of Section | Questions | Skills Tested |
|--------|-------------|-----------|---------------|
| Craft & Structure | ~28% | 13–15 | Words in Context, Text Structure & Purpose, Cross-Text Connections |
| Information & Ideas | ~26% | 12–14 | Central Ideas & Details, Command of Evidence (Textual), Command of Evidence (Quantitative) |
| Standard English Conventions | ~26% | 11–15 | Boundaries (sentence structure, punctuation), Form/Structure/Sense (grammar, usage) |
| Expression of Ideas | ~20% | 8–12 | Rhetorical Synthesis, Transitions |

### 3.2 Math Domains

| Domain | % of Section | Questions | Skills Tested |
|--------|-------------|-----------|---------------|
| Algebra | ~35% | 13–15 | Linear equations, inequalities, systems of equations, linear functions |
| Advanced Math | ~35% | 13–15 | Quadratic, polynomial, exponential, radical, rational equations and functions |
| Problem-Solving & Data Analysis | ~15% | 5–7 | Ratios, rates, percentages, probability, statistics, data interpretation |
| Geometry & Trigonometry | ~15% | 5–7 | Area, volume, angles, triangles, circles, trigonometric functions |

### 3.3 Question Bank Target: 300+ Questions

**Reading & Writing (160 questions):**

| Domain | Easy | Medium | Hard | Total |
|--------|------|--------|------|-------|
| Craft & Structure | 12 | 20 | 10 | 42 |
| Information & Ideas | 10 | 18 | 10 | 38 |
| Standard English Conventions | 12 | 22 | 8 | 42 |
| Expression of Ideas | 10 | 18 | 10 | 38 |

**Math (160 questions):**

| Domain | Easy | Medium | Hard | Total |
|--------|------|--------|------|-------|
| Algebra | 14 | 22 | 10 | 46 |
| Advanced Math | 12 | 22 | 12 | 46 |
| Problem-Solving & Data Analysis | 8 | 14 | 6 | 28 |
| Geometry & Trigonometry | 8 | 14 | 8 | 30 |

**Difficulty Mix:** Easy 30%, Medium 50%, Hard 20% — same as AP Chem app.

### 3.4 Passage Requirements (RW Section)

Each RW question must include a passage (25–150 words) drawn from one of these subject areas:
- **Literature** — fiction excerpts, poetry analysis
- **History/Social Studies** — historical documents, social science passages
- **Humanities** — arts, philosophy, culture
- **Science** — natural science, research findings

Some questions include informational graphics (tables, bar graphs, line graphs) alongside passages.

---

## 4. New Feature Specifications

### 4.1 SM-2 Spaced Repetition Engine

*Identical to AP Chem app implementation.* Every question gets its own scheduling state.

**Data model additions (per question):**

```
{
  questionId: string,
  efactor: number,        // Easiness Factor, starts at 2.5
  interval: number,       // Days until next review
  repetition: number,     // Consecutive correct count
  nextReviewDate: Date,   // When to show again
  lastQuality: number     // Most recent self-rating 0–5
}
```

**Core logic:** Same SM-2 algorithm as AP Chem app.

**Integration points:**
- **Mixed Practice** mode draws from questions whose `nextReviewDate ≤ today`, prioritized by how overdue they are.
- **Weak Areas** mode additionally filters for items with EF < 2.0.
- Dashboard shows "Due Today" count and upcoming review forecast.

---

### 4.2 Strategic Interleaving System

Move beyond random question selection. The app should intentionally mix related-but-confusable concepts within a session to build discrimination power.

**Math Confusable Pairs:**

| Pair A | Pair B | Why They Confuse |
|--------|--------|-----------------|
| Linear equations | Linear inequalities | Same algebra, different solution notation and graphing |
| Systems of equations (substitution) | Systems of equations (elimination) | Same problem type, different strategies |
| Quadratic formula | Completing the square | Both solve quadratics, different methods |
| Exponential growth | Linear growth | Similar word problems, different models |
| Mean/median/mode | Standard deviation/range | Both are "statistics" but measure different things |
| Circle equations | Circle geometry (arc, sector) | Both involve circles, different math |
| SOH-CAH-TOA ratios | Unit circle values | Both trig, different frameworks |
| Percent increase | Percent of a number | Same "percent" keyword, different operations |
| Absolute value equations | Absolute value inequalities | Same concept, different solution methods |
| Slope from equation | Slope from two points | Same concept, different calculation |

**Reading & Writing Confusable Pairs:**

| Pair A | Pair B | Why They Confuse |
|--------|--------|-----------------|
| Words in Context | Text Structure & Purpose | Both require passage analysis, different focus |
| Central Ideas | Author's Purpose | Both ask "what is this about" differently |
| Command of Evidence (Textual) | Command of Evidence (Quantitative) | Same skill name, text vs. chart |
| Transitions (contrast) | Transitions (continuation) | Same question format, opposite logic |
| Sentence boundaries (semicolons) | Sentence boundaries (commas) | Similar punctuation decisions |
| Subject-verb agreement | Pronoun-antecedent agreement | Both are "agreement" rules |
| Rhetorical Synthesis | Conclusions | Both ask for the best ending/summary |
| Restrictive vs. non-restrictive clauses | Comma splice vs. run-on | Both involve comma placement |

**Implementation:**
- Tag each question with a `confusableGroup` identifier.
- In Mixed Practice and interleaved sessions, after presenting a question from group A, the next question is drawn from a related confusable group before moving on.
- **Hybrid Approach**: when a student enters a new domain via Topic Review, serve a block of 5–8 questions on that domain, then automatically transition into interleaved review mixing the new domain with 2–3 older domains.

---

### 4.3 Dual Coding — Visual Enrichment Layer

Every question and explanation should engage both verbal and visual processing channels.

**Question data model additions:**

```
{
  ...existing fields,
  passage?: {
    text: string,
    subject: 'literature' | 'history' | 'humanities' | 'science',
    graphic?: {
      type: 'table' | 'bar-graph' | 'line-graph' | 'scatter-plot',
      src: string,
      altText: string,
      caption?: string
    }
  },
  visualAsset?: {
    type: 'graph' | 'diagram' | 'number-line' | 'coordinate-plane' | 'geometric-figure' | 'table',
    src: string,
    altText: string,
    caption?: string
  },
  formulaDisplay?: string  // LaTeX for rendered formula
}
```

**Requirements:**
- All math questions involving graphs, geometric figures, or coordinate planes must have associated visual assets.
- RW questions with quantitative evidence must include the referenced table/graph.
- Explanations should pair worked solutions with visual step-by-step breakdowns for math.
- Use inline rendered formulas (KaTeX) for all mathematical notation.
- Priority visual coverage: Algebra (coordinate planes, system graphs), Geometry & Trig (figures, unit circle), Problem-Solving & Data Analysis (charts, tables), RW Quantitative Evidence (data graphics).

---

### 4.4 Elaborative Interrogation Prompts

After answering a question correctly, present an optional "Deep Dive" prompt that asks *why* the answer is correct at a deeper conceptual level.

**Behavior:** Same phased approach as AP Chem app.

- **Phase 1 (foundational):** No Deep Dive — standard feedback only.
- **Phase 2 (integration):** "Why" prompts linking concepts (e.g., "Why does this sentence need a semicolon here instead of a comma?" or "Why can't the slope be negative in this context?").
- **Phase 3 (transfer):** Apply reasoning to novel scenarios or cross-domain connections.

**Question data model addition:**

```
{
  ...existing fields,
  eiPhase: 1 | 2 | 3,
  deepDivePrompt?: {
    question: string,
    options?: string[],
    correctExplanation: string,
    conceptLink: string
  }
}
```

**SAT-specific Deep Dive examples:**
- Math: "You used the quadratic formula here. Under what conditions would factoring be faster?"
- RW: "You identified the transition word as a contrast. What other transition words signal the same logical relationship?"
- RW: "Why does the author use a dash here instead of a comma? What rhetorical effect does it create?"

---

### 4.5 Metacognitive Calibration

*Same system as AP Chem app:* confidence rating + exam wrappers.

**Confidence Rating:**
- After submitting but before feedback, 1–5 confidence slider.
- Dashboard shows Calibration Score (correlation over last 50 attempts).
- Bonus XP for well-calibrated answers.

**Exam Wrappers:**
- After Timed Test sessions, 60-second reflection.
- Error categories adapted for SAT: "Silly mistake," "Misread the passage/question," "Content gap," "Ran out of time," "Trapped by distractor answer."
- Store wrapper data and surface patterns (e.g., "50% of your RW errors are 'trapped by distractor'").

**Progress data model additions:**

```
{
  questionId: string,
  attempts: [
    {
      timestamp: Date,
      correct: boolean,
      userAnswer: any,
      confidenceRating: number,       // 1–5
      deepDiveCompleted?: boolean,
      errorCategory?: 'silly-mistake' | 'misread' | 'content-gap' | 'time' | 'distractor-trap'
    }
  ]
}
```

---

### 4.6 Gamification: XP, Levels, and Rewards

**XP System:**

| Action | XP Earned |
|--------|-----------|
| Answer a question correctly | 10 XP |
| Answer correctly on first try (no hints used) | +5 bonus |
| Complete a Deep Dive prompt correctly | +8 XP |
| Well-calibrated confidence rating | +3 XP |
| Complete an Exam Wrapper | 15 XP |
| Answer a "hard" question correctly | +10 bonus |
| Answer an overdue SM-2 question correctly | +5 bonus |
| Defeat a Boss Fight (see §4.8) | 50 XP |
| Complete a full Adaptive Mock Test | 25 XP |
| Answer a grid-in question correctly | +3 bonus |

**Level Progression:**
- 10 levels, progressively more XP (L1: 0, L2: 100, L3: 250, L4: 500 ... L10: 5000).
- Each level unlocks an SAT-themed title:
  1. "Test Taker" → 2. "Score Seeker" → 3. "Section Strategist" → 4. "Passage Pro" → 5. "Equation Explorer" → 6. "Domain Specialist" → 7. "Module Master" → 8. "Adaptive Ace" → 9. "Score Crusher" → 10. "SAT Champion"

**Badges:**
- **Domain mastery badges**: "Grammar Guardian" (Standard English Conventions), "Algebra Ace," "Data Detective" (PS&DA), "Geometry Guru," "Vocabulary Virtuoso" (Craft & Structure), "Evidence Expert" (Information & Ideas), "Expression Engineer," "Advanced Math Maven"
- **Behavior badges**: "7-Day Streak," "30-Day Streak," "First Boss Defeated," "Perfect Calibration" (10 consecutive well-calibrated answers), "Deep Thinker" (50 Deep Dives), "Speed Demon" (complete a timed module under time), "Grid-In Gladiator" (20 consecutive correct grid-ins)
- Badges displayed on profile/trophy page and optionally on dashboard.

---

### 4.7 Streaks and Behavioral Nudges

*Same system as AP Chem app.*

- Track consecutive calendar days with ≥1 completed question.
- Flame icon on dashboard, streak freeze every 7 days.
- Nudge: "Don't break your X-day streak — just 5 questions to keep it alive!"
- Effort-based norms only (never performance-based comparisons).

---

### 4.8 Quests and Boss Fights

**Domain Quests:**
- Each of the 8 SAT content domains is framed as a "Quest" with a progress tracker.
- A Quest requires: answer X questions, achieve Y% accuracy, complete Z Deep Dives, reach SM-2 mastery threshold.
- Completing a Quest awards a domain badge + large XP bonus.

**Section Quests (meta-quests):**
- "Reading & Writing Mastery" — complete all 4 RW domain quests.
- "Math Mastery" — complete all 4 Math domain quests.
- "SAT Ready" — complete both section quests.

**Boss Fights:**
- When a student enters Weak Areas mode, their lowest-performing domain is presented as a "Boss Fight."
- A Boss Fight is 8–12 questions from the weak domain, interleaved with 2–3 confusable-pair questions.
- To "defeat the boss," score ≥75% in the session.
- Failing provides encouraging feedback + targeted review suggestions.
- Victory awards 50 XP + boss-specific badge.

---

### 4.9 Multiple-Try Feedback with Hints (Freedom to Fail)

*Same tiered system as AP Chem app.*

- **Easy questions**: immediate correct/incorrect.
- **Medium questions**: Hint 1 on first incorrect (conceptual nudge), Hint 2 on second incorrect (more specific), full explanation on third.
- **Hard questions**: "Need a hint?" available before first attempt.
- XP scaled: 100% → 60% → 30% → 0%.

**Question data model addition:**

```
{
  ...existing fields,
  hints?: [string, string]
}
```

**SAT-specific hint examples:**
- Math (Algebra): Hint 1: "Try isolating the variable on one side first." Hint 2: "Subtract 3x from both sides, then divide by 2."
- RW (Grammar): Hint 1: "Look at the sentence structure — is this an independent or dependent clause?" Hint 2: "Two independent clauses need a semicolon, period, or comma + conjunction."

---

### 4.10 Adaptive Scaffolding with Fading

*Same rules as AP Chem app.*

- **Hints available**: only when `efactor < 2.2` or `repetition < 3`.
- **Formula/rule reference**: show relevant math formulas or grammar rules when domain accuracy < 50%. Toggle-accessible above 70%.
- **Deep Dive prompts**: start multiple-choice, switch to free-text after 5 correct in a domain.
- **Transition nudge**: "You've mastered this with support. Ready to try without hints?"
- **Student override**: Settings toggle to re-enable scaffolding.

---

### 4.11 Adaptive Mock Test Mode (SAT-Specific)

Simulate the real Digital SAT's adaptive module structure.

**Behavior:**
- **Full Test**: 2 hours 14 minutes, 98 questions, structured exactly like the real SAT.
  - RW Module 1: 27 questions, 32 minutes
  - RW Module 2: 27 questions, 32 minutes (difficulty adapts based on Module 1 score)
  - 10-minute break
  - Math Module 1: 22 questions, 35 minutes
  - Math Module 2: 22 questions, 35 minutes (difficulty adapts based on Module 1 score)
- **Section Test**: Test just RW or just Math (2 modules each).
- **Module-level adaptation**: If Module 1 score ≥ 70%, Module 2 draws primarily from medium and hard questions. If < 70%, Module 2 draws from easy and medium.
- During the test, no feedback is shown — just "Answer recorded."
- After the test, full review with each question, student's answer, correctness, confidence rating, and explanation.
- Followed by Exam Wrapper reflection.
- Estimated score displayed using a simplified scoring algorithm that accounts for question difficulty and module difficulty.

---

### 4.12 Delayed Feedback Mode (Timed Test Enhancement)

*Same as AP Chem app.*

- During timed tests, suppress per-question feedback.
- End-of-session full review.
- Followed by Exam Wrapper.

---

### 4.13 Think Period (Hard Questions)

*Same as AP Chem app.*

- For hard questions, hide answer choices for 3–5 seconds.
- "Think..." overlay with countdown.
- Applies to all Hard difficulty questions and `requiresThinkPeriod: true`.
- Toggleable in Settings.

---

### 4.14 SAT-Specific Strategy Tips

Display contextual strategy tips during practice sessions.

**RW Strategies:**
- "Read the question first, then the passage."
- "Eliminate answers that go beyond what the passage says."
- "For grammar questions, read the sentence aloud in your head."
- "Transition questions: identify the logical relationship before looking at choices."

**Math Strategies:**
- "For grid-in questions, double-check your arithmetic."
- "Plug in answer choices when solving algebraically feels complex."
- "Draw diagrams for word problems without figures."
- "Use the Desmos calculator for graphing questions."

**Implementation:**
- Tag questions with optional `strategyTip: string`.
- Display tip alongside the question when scaffolding is active (accuracy < 50% in domain).
- Fade as mastery increases.

---

### 4.15 Dashboard & Analytics Enhancements

Expand the dashboard with SAT-specific data streams:

- **Due Today widget**: SM-2 items due for review.
- **Streak display**: current streak, flame icon, longest streak.
- **XP and Level bar**: current level, XP progress to next level.
- **Calibration gauge**: confidence-accuracy alignment.
- **Domain progress**: mini progress bars for each of the 8 content domains, grouped by section.
- **Section scores**: estimated RW and Math scores (200–800) based on recent performance.
- **Quest progress**: per-domain quest trackers.
- **Boss Fight CTA**: "Challenge the Boss" button when weak areas exist.
- **Error pattern chart**: Exam Wrapper error categories over time.
- **Review forecast**: 7-day calendar showing items due each day.
- **Recommended focus**: suggestion based on overdue items + weak EF + quest proximity.
- **Time per question**: average time spent per question by domain (pacing analysis).
- **Mock test history**: scores from completed Adaptive Mock Tests with trend chart.

---

## 5. Updated Data Structures

### 5.1 Question (SAT)

```
{
  id: string,
  section: 'reading-writing' | 'math',
  domain: string,                    // e.g., 'algebra', 'craft-and-structure'
  skill: string,                     // e.g., 'words-in-context', 'linear-equations'
  difficulty: 'easy' | 'medium' | 'hard',
  type: 'multiple-choice' | 'grid-in',
  question: string,
  options?: string[],                // for multiple choice (4 options)
  correctAnswer: string | number,
  explanation: string,
  relatedConcepts: string[],
  formula?: string,

  // Passage (for RW questions, and some math word problems)
  passage?: {
    text: string,
    subject?: 'literature' | 'history' | 'humanities' | 'science',
    graphic?: {
      type: 'table' | 'bar-graph' | 'line-graph' | 'scatter-plot',
      src: string,
      altText: string,
      caption?: string
    }
  },

  // v2 feature fields
  confusableGroup?: string,
  eiPhase: 1 | 2 | 3,
  deepDivePrompt?: {
    question: string,
    options?: string[],
    correctExplanation: string,
    conceptLink: string
  },
  hints?: [string, string],
  visualAsset?: {
    type: 'graph' | 'diagram' | 'number-line' | 'coordinate-plane' | 'geometric-figure' | 'table',
    src: string,
    altText: string,
    caption?: string
  },
  formulaDisplay?: string,           // KaTeX string
  requiresThinkPeriod?: boolean,
  strategyTip?: string
}
```

### 5.2 User Progress (SAT)

```
{
  questionId: string,
  attempts: [
    {
      timestamp: Date,
      correct: boolean,
      userAnswer: any,
      confidenceRating: number,       // 1–5
      hintsUsed: number,
      deepDiveCompleted?: boolean,
      deepDiveCorrect?: boolean,
      errorCategory?: 'silly-mistake' | 'misread' | 'content-gap' | 'time' | 'distractor-trap',
      timeSpent?: number              // seconds spent on this question
    }
  ],
  masteryLevel: number,
  lastAttempted: Date,

  // SM-2 fields
  efactor: number,
  interval: number,
  repetition: number,
  nextReviewDate: Date,
  lastQuality: number
}
```

### 5.3 Gamification State

```
{
  xp: number,
  level: number,
  currentStreak: number,
  longestStreak: number,
  lastActiveDate: Date,
  streakFreezes: number,
  badges: [
    { id: string, name: string, earnedDate: Date, icon: string }
  ],
  questProgress: {
    [domainId: string]: {
      questionsAnswered: number,
      accuracyPercent: number,
      deepDivesCompleted: number,
      masteryThresholdMet: boolean,
      completed: boolean,
      completedDate?: Date
    }
  },
  sectionQuests: {
    readingWriting: boolean,
    math: boolean,
    satReady: boolean
  },
  bossesDefeated: string[],
  examWrappers: [
    {
      sessionId: string,
      date: Date,
      errorBreakdown: {
        sillyMistake: number,
        misread: number,
        contentGap: number,
        time: number,
        distractorTrap: number
      }
    }
  ],
  mockTestHistory: [
    {
      date: Date,
      rwScore: number,      // estimated 200–800
      mathScore: number,    // estimated 200–800
      totalScore: number,   // estimated 400–1600
      questionsCorrect: number,
      totalQuestions: number,
      timeUsed: number      // seconds
    }
  ]
}
```

---

## 6. UI/UX Changes

### 6.1 New Components

- **XPBar**: persistent header component showing level, XP progress, and streak. *(shared with AP Chem)*
- **ConfidenceSlider**: 1–5 rating widget. *(shared)*
- **HintPanel**: collapsible progressive hints with retry button. *(shared)*
- **ThinkOverlay**: countdown overlay hiding answer choices. *(shared)*
- **DeepDiveCard**: secondary prompt card. *(shared)*
- **BossFightIntro**: animated intro screen. *(shared)*
- **QuestProgressBar**: per-domain progress tracker. *(shared, adapted for 8 domains)*
- **CalibrationGauge**: confidence-accuracy gauge. *(shared)*
- **ReviewForecast**: 7-day mini-calendar. *(shared)*
- **ExamWrapperForm**: post-test reflection with SAT-specific error categories. *(adapted)*
- **BadgeGrid**: trophy/profile page. *(shared)*
- **FormulaRenderer**: KaTeX component. *(shared)*
- **VisualAssetViewer**: diagrams, graphs, coordinate planes. *(shared, adapted)*
- **PassageViewer**: NEW — renders short passages with optional graphics (tables, charts) in a split-pane layout matching the Bluebook interface.
- **GridInInput**: NEW — numerical input component for student-produced response questions with validation, matching SAT grid-in rules (fractions, decimals, negatives).
- **AdaptiveModuleEngine**: NEW — logic component that selects Module 2 difficulty based on Module 1 performance.
- **ScoreEstimator**: NEW — widget that estimates 200–800 section scores and 400–1600 total based on performance data.
- **StrategyTipBanner**: NEW — contextual strategy tip display that fades with mastery.
- **SectionToggle**: NEW — toggle between RW and Math sections in dashboard and practice views.
- **MockTestTimer**: NEW — multi-module timer with break period, matching SAT structure.

### 6.2 Modified Components (from AP Chem)

- **QuestionCard**: add passage viewer area, grid-in input support, formula rendering, think period overlay, and hint button.
- **FeedbackCard**: add confidence result display, Deep Dive button, XP earned animation, and strategy tip.
- **Dashboard**: restructure for 8 domains (grouped by section), dual section scores, mock test history chart.
- **Timer**: support multi-module structure with breaks.
- **Navigation**: add section filter, badges/profile page link.

### 6.3 New Pages

- **Profile/Trophies page**: level, total XP, all badges, streak history, overall stats. *(shared)*
- **Boss Fight page**: specialized practice view with boss theme. *(shared)*
- **Exam Review page**: post-timed-test review. *(shared, adapted for SAT module structure)*
- **Adaptive Mock Test page**: NEW — full SAT simulation with module transitions, break timer, and score report.
- **Score Trends page**: NEW — historical mock test scores with trend lines, target score overlay, and projected test-day score.

---

## 7. Study Modes

### 7.1 Practice Mode
Answer questions at own pace with immediate feedback. Filter by section (RW/Math) and domain.

### 7.2 Weak Areas Focus
Automatically serves questions with lowest success rate and lowest SM-2 EF. Groups by domain for targeted review.

### 7.3 Domain Review
Filter and practice a specific content domain (e.g., just Algebra, just Standard English Conventions). Hybrid approach: block of 5–8 questions, then interleaved transition.

### 7.4 Mixed Practice
Random questions weighted toward weaker areas, drawn from SM-2 overdue items. Interleaves confusable pairs.

### 7.5 Timed Module Practice
Practice a single module: 27 RW questions in 32 minutes, or 22 Math questions in 35 minutes. Delayed feedback.

### 7.6 Adaptive Mock Test
Full SAT simulation (see §4.11). 98 questions, 2 hours 14 minutes, adaptive Module 2 difficulty, score estimate at the end.

### 7.7 Boss Fight
Focused challenge on weakest domain (see §4.8).

---

## 8. Technical Requirements

### 8.1 Shared Dependencies (with AP Chem app)

- **React 18+**: frontend framework
- **Tailwind CSS**: styling
- **KaTeX**: formula rendering
- **date-fns** or **dayjs**: date arithmetic for SM-2 and streaks
- **Framer Motion** (optional): animations for XP gains, level-ups, boss fights
- **localStorage / IndexedDB**: data persistence

### 8.2 New Dependencies

- **Desmos API** (optional): embed Desmos calculator widget for math practice to simulate the real SAT experience
- **react-split-pane** or equivalent: for passage + question split-view layout matching Bluebook

### 8.3 Code Reuse Strategy

The following modules can be shared directly from the AP Chemistry app with minimal or no modification:

| Module | Reuse Level | Changes Needed |
|--------|------------|----------------|
| SM-2 algorithm | 100% shared | None |
| XP/Level/Badge engine | 95% shared | New badge definitions, new level titles |
| Streak tracking | 100% shared | None |
| Confidence slider | 100% shared | None |
| Exam wrapper form | 90% shared | Add "distractor-trap" error category |
| Calibration gauge | 100% shared | None |
| Review forecast | 100% shared | None |
| Think overlay | 100% shared | None |
| Hint panel | 100% shared | None |
| Deep Dive card | 100% shared | None |
| Boss fight logic | 90% shared | Adapt for 8 domains instead of 9 units |
| Quest progress bar | 90% shared | Adapt for domains + section meta-quests |
| Dashboard layout | 60% shared | Restructure for 2 sections × 4 domains |
| Question card | 50% shared | Add passage viewer, grid-in input |
| Question data model | 30% shared | New fields for passages, sections, domains |
| Timer | 70% shared | Add multi-module + break support |

### 8.4 Storage

- Same localStorage/IndexedDB approach as AP Chem app.
- Separate storage namespace (e.g., `sat-app-progress` vs `ap-chem-progress`) so both apps can coexist.

### 8.5 Performance Considerations

- Same as AP Chem app: SM-2 recalculations per-question, interleaving queue precomputed at session start, visual assets lazy-loaded, badge checks as post-answer side effects.
- Passage rendering should use virtualized text for long passages.
- Mock test mode should pre-generate the full question set at test start.

---

## 9. Implementation Task List

### Phase 1: Project Setup & Architecture

- [ ] Initialize React app (or fork from AP Chem app codebase)
- [ ] Set up Tailwind CSS
- [ ] Configure ESLint and Prettier
- [ ] Set up React Router with SAT-specific routes
- [ ] Create folder structure adapted for SAT (sections, domains, skills)
- [ ] Set up state management
- [ ] Create SAT-specific data models/types
- [ ] Import shared modules from AP Chem app (SM-2, XP, streaks, calibration)
- [ ] Set up separate localStorage namespace

### Phase 2: Data & Content — Reading & Writing

- [ ] Create RW question bank data structure with passage support
- [ ] Write 42 questions for Craft & Structure domain
  - [ ] Words in Context (14)
  - [ ] Text Structure & Purpose (14)
  - [ ] Cross-Text Connections (14)
- [ ] Write 38 questions for Information & Ideas domain
  - [ ] Central Ideas & Details (13)
  - [ ] Command of Evidence — Textual (13)
  - [ ] Command of Evidence — Quantitative (12, with graphics)
- [ ] Write 42 questions for Standard English Conventions domain
  - [ ] Boundaries (21)
  - [ ] Form, Structure, and Sense (21)
- [ ] Write 38 questions for Expression of Ideas domain
  - [ ] Rhetorical Synthesis (19)
  - [ ] Transitions (19)
- [ ] Source/write 160 short passages (25–150 words each) across literature, history, humanities, science
- [ ] Create informational graphics for quantitative evidence questions
- [ ] Tag all questions with confusableGroup, eiPhase, difficulty
- [ ] Validate all questions for accuracy, clarity, and SAT format fidelity

### Phase 3: Data & Content — Math

- [ ] Create Math question bank data structure with grid-in support
- [ ] Write 46 questions for Algebra domain
  - [ ] Linear equations in 1 variable (10)
  - [ ] Linear equations in 2 variables (10)
  - [ ] Linear functions (10)
  - [ ] Systems of linear equations (8)
  - [ ] Linear inequalities (8)
- [ ] Write 46 questions for Advanced Math domain
  - [ ] Equivalent expressions (10)
  - [ ] Nonlinear equations (12)
  - [ ] Nonlinear functions (12)
  - [ ] Quadratic equations & functions (12)
- [ ] Write 28 questions for Problem-Solving & Data Analysis domain
  - [ ] Ratios, rates, proportional relationships (8)
  - [ ] Percentages (6)
  - [ ] Probability and statistics (8)
  - [ ] Data interpretation (6)
- [ ] Write 30 questions for Geometry & Trigonometry domain
  - [ ] Area and volume (8)
  - [ ] Lines, angles, and triangles (8)
  - [ ] Circles (7)
  - [ ] Trigonometry (7)
- [ ] Ensure ~25% of math questions are grid-in format
- [ ] Create visual assets for geometry, coordinate plane, and data questions
- [ ] Tag all questions with confusableGroup, eiPhase, difficulty
- [ ] Write hints for all medium and hard questions
- [ ] Validate all questions for accuracy

### Phase 4: Core Components

- [ ] Build PassageViewer component (split-pane, passage + question)
- [ ] Build GridInInput component (numerical input with SAT validation rules)
- [ ] Adapt QuestionCard for SAT (passage support, grid-in support)
- [ ] Build SectionToggle component (RW / Math filter)
- [ ] Adapt FeedbackCard for SAT
- [ ] Build MockTestTimer component (multi-module, breaks)
- [ ] Build ScoreEstimator component
- [ ] Build StrategyTipBanner component
- [ ] Adapt all shared components from AP Chem (XPBar, ConfidenceSlider, HintPanel, etc.)

### Phase 5: SM-2 & Interleaving Integration

- [ ] Verify SM-2 module works with SAT question data model
- [ ] Assign confusableGroup tags to all 300+ questions
- [ ] Build interleaving queue algorithm for SAT confusable pairs
- [ ] Implement Hybrid Approach for Domain Review mode
- [ ] Update Mixed Practice to use interleaving
- [ ] Add "Due Today" count to dashboard
- [ ] Build review forecast widget
- [ ] Test interleaving across Math and RW domains

### Phase 6: Gamification Integration

- [ ] Define SAT-specific badges and unlock criteria
- [ ] Define SAT level titles
- [ ] Configure XP reward table (including grid-in bonus, mock test bonus)
- [ ] Build domain quest definitions (8 quests + 2 section quests + 1 meta-quest)
- [ ] Build QuestProgressBar adapted for 8 domains
- [ ] Build Boss Fight logic adapted for SAT domains
- [ ] Build BossFightIntro, victory, and retry screens
- [ ] Build BadgeGrid / profile page

### Phase 7: Metacognition Integration

- [ ] Wire ConfidenceSlider into SAT question flow
- [ ] Adapt ExamWrapperForm with "distractor-trap" category
- [ ] Build calibration gauge
- [ ] Build error pattern chart for analytics
- [ ] Award XP for calibration and wrapper completion

### Phase 8: Adaptive Mock Test Mode

- [ ] Build AdaptiveModuleEngine (Module 2 difficulty selection based on Module 1 score)
- [ ] Build question selection algorithm for each module (mix of domains, ordered easy → hard within modules)
- [ ] Build full mock test flow: RW M1 → RW M2 → Break → Math M1 → Math M2
- [ ] Build test review page showing all questions, answers, explanations
- [ ] Build score estimation algorithm (accounting for module difficulty)
- [ ] Build mock test results page with estimated section and total scores
- [ ] Integrate Exam Wrapper into mock test completion flow
- [ ] Store mock test history
- [ ] Build Score Trends page with historical chart

### Phase 9: Study Modes

- [ ] Implement Practice Mode with section/domain filtering
- [ ] Implement Weak Areas Focus mode
- [ ] Implement Domain Review mode with hybrid interleaving
- [ ] Implement Mixed Practice mode (SM-2 weighted, interleaved)
- [ ] Implement Timed Module Practice mode (single module, delayed feedback)
- [ ] Implement Boss Fight mode
- [ ] Add mode selection UI on dashboard

### Phase 10: Hints, Scaffolding, and Strategy Tips

- [ ] Write hints for all medium and hard questions (2 per question)
- [ ] Build HintPanel with retry logic
- [ ] Implement scaffolding rules (formula/rule visibility, hint availability, Deep Dive transitions)
- [ ] Write strategy tips for each domain
- [ ] Build StrategyTipBanner with scaffolding-aware display
- [ ] Add Settings toggle for scaffold override

### Phase 11: Dashboard & Analytics

- [ ] Redesign dashboard for 2-section, 8-domain layout
- [ ] Integrate Due Today widget
- [ ] Integrate streak display
- [ ] Integrate XP/level bar
- [ ] Integrate domain quest progress (grouped by section)
- [ ] Integrate boss fight CTA
- [ ] Integrate calibration gauge
- [ ] Integrate error pattern chart
- [ ] Integrate review forecast calendar
- [ ] Build estimated section scores (RW 200–800, Math 200–800, Total 400–1600)
- [ ] Build mock test score trend chart
- [ ] Build time-per-question pacing analysis
- [ ] Build Recommended Focus algorithm
- [ ] Build Recommended Focus widget

### Phase 12: Elaborative Interrogation Content

- [ ] Tag all 300+ questions with eiPhase
- [ ] Write Deep Dive prompts for all Phase 2 and Phase 3 questions (target ≥100 prompts)
- [ ] Build DeepDiveCard component (adapted for SAT concepts)
- [ ] Integrate Deep Dive into FeedbackCard
- [ ] Track Deep Dive completion and award XP

### Phase 13: Content Enrichment & QA

- [ ] Review all 300+ questions for v2 field completeness
- [ ] Ensure every question has: confusableGroup, eiPhase, hints (medium/hard), visualAsset (where applicable), formulaDisplay, requiresThinkPeriod flag
- [ ] QA all passages for length compliance (25–150 words) and subject accuracy
- [ ] QA all visual assets for accuracy
- [ ] QA all hints for pedagogical quality
- [ ] QA all Deep Dive prompts
- [ ] Validate SM-2 scheduling produces sensible review intervals
- [ ] Validate adaptive mock test scoring algorithm against real SAT score tables

### Phase 14: Testing & Polish

- [ ] Unit test SM-2 algorithm (shared)
- [ ] Unit test interleaving queue algorithm
- [ ] Unit test XP/level/badge award logic
- [ ] Unit test streak logic
- [ ] Unit test scaffolding fade rules
- [ ] Unit test adaptive module engine (Module 2 difficulty selection)
- [ ] Unit test score estimation algorithm
- [ ] Unit test grid-in input validation
- [ ] Integration test: complete a full Practice session with all features
- [ ] Integration test: complete a full Adaptive Mock Test
- [ ] Integration test: Boss Fight flow
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness testing
- [ ] Performance audit
- [ ] Accessibility audit (ARIA labels, keyboard navigation)

### Phase 15: Documentation & Deployment

- [ ] Write README
- [ ] Document question data format for content contributors
- [ ] Document SM-2 and scoring algorithm parameters
- [ ] Document gamification reward table and badge criteria
- [ ] Create in-app onboarding flow
- [ ] Deploy to production
- [ ] Test deployed version end-to-end
- [ ] Gather feedback after 1 week of use
- [ ] Iterate on XP balance, badge criteria, scoring calibration, and scaffolding thresholds

---

## 10. Prioritization and Dependencies

| Priority | Phase | Depends On |
|----------|-------|-----------|
| P0 — Critical | Phase 1 (Setup) | None |
| P0 — Critical | Phase 2 (RW Content) | Phase 1 |
| P0 — Critical | Phase 3 (Math Content) | Phase 1 |
| P0 — Critical | Phase 4 (Core Components) | Phase 1 |
| P0 — Critical | Phase 5 (SM-2 & Interleaving) | Phase 2, 3 |
| P0 — Critical | Phase 6 (Gamification) | Phase 1 |
| P1 — High | Phase 7 (Metacognition) | Phase 6 |
| P1 — High | Phase 8 (Adaptive Mock Test) | Phase 2, 3, 4 |
| P1 — High | Phase 9 (Study Modes) | Phase 4, 5 |
| P1 — High | Phase 10 (Hints & Scaffolding) | Phase 2, 3 |
| P2 — Medium | Phase 11 (Dashboard) | Phase 5, 6, 7, 8 |
| P2 — Medium | Phase 12 (Elaborative Interrogation) | Phase 6, 13 |
| P2 — Medium | Phase 13 (Content QA) | Phase 2, 3 |
| P3 — Lower | Phase 14 (Testing) | All phases |
| P3 — Lower | Phase 15 (Deploy) | All phases |

---

## 11. Key Differences from AP Chemistry App

| Aspect | AP Chemistry App | SAT App |
|--------|-----------------|---------|
| Content structure | 9 units | 2 sections × 4 domains = 8 domains |
| Question types | MC, numerical, multi-part | MC, grid-in (SPR) |
| Passage-based questions | Rare | All RW questions have passages |
| Visual assets | Molecular diagrams, reaction graphs | Coordinate planes, geometric figures, data charts |
| Timed test structure | Single timed session | Adaptive modules (M1 → M2 per section) |
| Scoring | Mastery-based | Estimated 400–1600 score |
| Error categories | 4 types | 5 types (adds "distractor-trap") |
| Domain quests | 9 unit quests | 8 domain quests + 2 section + 1 meta |
| Confusable pairs | Chemistry-specific (Q/K, Ka/Kb, etc.) | Math + grammar confusables |
| Formula references | Chemistry formulas | Math formulas + grammar rules |

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Daily active usage (streak) | ≥5 days/week average |
| SM-2 review compliance | ≥80% of due items reviewed within 24 hours |
| Calibration improvement | Confidence-accuracy correlation improves by ≥0.2 over 4 weeks |
| Weak domain accuracy growth | ≥15% improvement in lowest-performing domain within 3 weeks |
| Quest completion rate | ≥6 of 8 domain quests completed before exam |
| Boss fights attempted | ≥1 per week |
| Deep Dive engagement | ≥40% of eligible prompts completed |
| Mock test score improvement | ≥80 points total score improvement over 2 months |
| Student-reported engagement | Reports app is "fun" or "motivating" |
| Mastery rate | ≥70% of questions at SM-2 repetition ≥3 before exam |
| Full mock tests completed | ≥4 before exam day |
