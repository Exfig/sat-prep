# SAT Study App — Adaptive Difficulty & Crowd-Sourced Question Scoring Addendum

## Overview

This addendum extends the SAT Study App to implement **dynamic question difficulty scoring** based on aggregate user performance data. Instead of pre-tagged difficulty levels (easy/medium/hard), the app will calculate real-time difficulty scores from actual student success rates, then use those scores to adaptively select questions that match each student's current ability level.

This creates a more personalized learning experience and mimics the adaptive testing methodology used in the actual Digital SAT.

---

## 1. Goals

1. **Crowd-sourced difficulty**: Calculate question difficulty based on actual user performance (% correct across all users)
2. **Real-time adaptation**: Adjust question selection difficulty dynamically as the student answers correctly or incorrectly
3. **Ability estimation**: Track each student's estimated ability level, update after each question
4. **Cold start handling**: Gracefully handle new questions with insufficient data
5. **Preserve SM-2**: Adaptive difficulty works *alongside* spaced repetition, not instead of it
6. **Analytics**: Show students and teachers how question difficulty evolves over time

---

## 2. Conceptual Model

### 2.1 Core Concepts

**Question Difficulty Score (QD):**
- Numeric value representing how hard a question is (0.0 = very easy, 1.0 = very hard)
- Calculated from aggregate success rate: `QD = 1 - (correct_attempts / total_attempts)`
- Example: 80% of users get it right → QD = 0.20 (easy)
- Example: 30% of users get it right → QD = 0.70 (hard)

**Student Ability Score (SA):**
- Numeric value representing the student's current skill level (0.0 = beginner, 1.0 = expert)
- Updated after each question based on correctness and question difficulty
- Starts at 0.5 (neutral), converges to true ability over ~20–30 questions

**Adaptive Selection:**
- Select questions with QD ≈ SA (slightly above for challenge, at level for reinforcement)
- If student answers correctly, increase SA slightly and select harder questions
- If student answers incorrectly, decrease SA slightly and select easier questions
- This creates a "flow state" where questions are always appropriately challenging

**Relationship to SM-2:**
- SM-2 determines *when* to review a question (spaced repetition)
- Adaptive difficulty determines *which* new questions to introduce
- Combined: "Show due questions from SM-2, then fill with adaptive new questions"

### 2.2 Visual Example

```
Question Pool (sorted by difficulty):
[Q1: 0.15] [Q2: 0.23] [Q3: 0.35] [Q4: 0.42] [Q5: 0.58] [Q6: 0.67] [Q7: 0.81] [Q8: 0.92]
   easy                   medium                  hard              very hard

Student progression:
Start: SA = 0.5 → Q4 (0.42) ✓ → SA = 0.53 → Q5 (0.58) ✗ → SA = 0.49 → Q4 (0.42) ✓ → SA = 0.52 ...
                  (matched)  correct, level up   (challenge)  incorrect, level down
```

---

## 3. Database Schema Extensions

### 3.1 New Table: question_stats

Track aggregate statistics for each question across all users.

```sql
CREATE TABLE question_stats (
  question_id TEXT PRIMARY KEY REFERENCES questions(id),
  
  -- Aggregate counts
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  
  -- Calculated metrics
  difficulty_score NUMERIC DEFAULT 0.5,  -- 0.0 (easy) to 1.0 (hard)
  confidence_interval NUMERIC DEFAULT 1.0,  -- 1.0 (low confidence) to 0.0 (high confidence), decreases as attempts increase
  
  -- Time tracking
  avg_time_spent INTEGER,  -- average seconds spent on this question
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by difficulty
CREATE INDEX idx_question_stats_difficulty ON question_stats(difficulty_score);
CREATE INDEX idx_question_stats_confidence ON question_stats(confidence_interval);

-- No RLS needed — aggregate stats viewable by all authenticated users
ALTER TABLE question_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Question stats are viewable by authenticated users" ON question_stats FOR SELECT TO authenticated USING (true);
```

**Note:** This table is updated server-side (via database trigger or function), not directly by client.

### 3.2 New Table: user_ability

Track each student's estimated ability level over time.

```sql
CREATE TABLE user_ability (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Overall ability (across all domains)
  overall_ability NUMERIC DEFAULT 0.5,  -- 0.0 (beginner) to 1.0 (expert)
  
  -- Per-section ability
  rw_ability NUMERIC DEFAULT 0.5,
  math_ability NUMERIC DEFAULT 0.5,
  
  -- Per-domain ability (more granular)
  domain_abilities JSONB DEFAULT '{}'::jsonb,  
  -- e.g., { "algebra": 0.62, "craft-and-structure": 0.48, ... }
  
  -- Confidence/reliability
  questions_answered INTEGER DEFAULT 0,  -- more questions = more reliable estimate
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only view/update their own ability
ALTER TABLE user_ability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ability" ON user_ability FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own ability" ON user_ability FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ability" ON user_ability FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3.3 Modified Table: attempts

Add fields to track difficulty at time of attempt (for historical analysis).

```sql
-- Add columns to existing attempts table
ALTER TABLE attempts ADD COLUMN question_difficulty NUMERIC;  -- QD at time of attempt
ALTER TABLE attempts ADD COLUMN user_ability_before NUMERIC;  -- SA before this attempt
ALTER TABLE attempts ADD COLUMN user_ability_after NUMERIC;   -- SA after this attempt
```

---

## 4. Difficulty Calculation Algorithm

### 4.1 Basic Difficulty Formula

**Simple version (percentage-based):**
```
difficulty_score = 1 - (correct_attempts / total_attempts)
```

- 100% correct → difficulty = 0.0 (very easy)
- 50% correct → difficulty = 0.5 (medium)
- 20% correct → difficulty = 0.8 (hard)

**Confidence interval:**
```
confidence_interval = 1 / sqrt(total_attempts)
```

- 1 attempt → confidence = 1.0 (very uncertain)
- 25 attempts → confidence = 0.2
- 100 attempts → confidence = 0.1 (high confidence)

### 4.2 Advanced: Elo-style Rating System (Optional)

For more sophisticated difficulty scoring, adapt the Elo rating system used in chess:

**Question starts with rating 1500 (neutral):**
```
K = 32  // sensitivity factor
Expected_score = 1 / (1 + 10^((user_ability_rating - question_rating) / 400))

If user answers correctly:
  question_rating_new = question_rating - K * (1 - Expected_score)
  // Question "loses" rating because user beat it

If user answers incorrectly:
  question_rating_new = question_rating + K * (1 - Expected_score)
  // Question "gains" rating because it beat the user

difficulty_score = (question_rating - 1000) / 1000  // normalize to 0.0–1.0
```

This accounts for *who* got the question right/wrong, not just the raw percentage.

**Recommendation:** Start with simple percentage-based, upgrade to Elo if needed.

---

## 5. Student Ability Estimation

### 5.1 Initial Ability

When a student first signs up:
```
overall_ability = 0.5  // neutral starting point
questions_answered = 0
```

### 5.2 Ability Update Algorithm

After each question attempt:

**Simple moving average approach:**
```javascript
// When student answers a question
const question_difficulty = question_stats.difficulty_score
const was_correct = attempt.correct

// Calculate performance delta
let performance = was_correct ? 1.0 : 0.0
let delta = (performance - question_difficulty) * learning_rate

// Learning rate decreases as confidence increases
const learning_rate = 0.1 / (1 + Math.sqrt(questions_answered / 100))

// Update ability
new_ability = current_ability + delta
new_ability = Math.max(0.0, Math.min(1.0, new_ability))  // clamp to [0, 1]
```

**Example:**
- Student (SA = 0.50) answers a hard question (QD = 0.70) correctly
- Performance = 1.0, delta = (1.0 - 0.70) * 0.1 = +0.03
- New SA = 0.53 (ability increased)

- Student (SA = 0.53) answers a medium question (QD = 0.45) incorrectly
- Performance = 0.0, delta = (0.0 - 0.45) * 0.09 = -0.04
- New SA = 0.49 (ability decreased)

### 5.3 Domain-Specific Ability

Track ability separately per domain for more granular adaptation:

```javascript
// Update domain-specific ability
const domain = question.domain  // e.g., 'algebra'
const current_domain_ability = user_ability.domain_abilities[domain] || 0.5

const new_domain_ability = current_domain_ability + delta
user_ability.domain_abilities[domain] = new_domain_ability

// Update overall ability as weighted average of domain abilities
const domain_weights = {
  'algebra': 0.125,
  'advanced-math': 0.125,
  // ... all 8 domains
}
user_ability.overall_ability = weighted_average(domain_abilities, domain_weights)
```

### 5.4 Section-Specific Ability

```javascript
// Update section ability (RW vs Math)
if (question.section === 'reading-writing') {
  user_ability.rw_ability = weighted_average([
    domain_abilities['craft-and-structure'],
    domain_abilities['information-and-ideas'],
    domain_abilities['standard-english-conventions'],
    domain_abilities['expression-of-ideas']
  ])
} else if (question.section === 'math') {
  user_ability.math_ability = weighted_average([
    domain_abilities['algebra'],
    domain_abilities['advanced-math'],
    domain_abilities['problem-solving-data-analysis'],
    domain_abilities['geometry-trigonometry']
  ])
}
```

---

## 6. Adaptive Question Selection

### 6.1 Selection Strategy

**Goal:** Select questions with difficulty ≈ student's ability ± tolerance.

```javascript
async function selectAdaptiveQuestions(userId, domain, count = 10) {
  // 1. Get student's current ability for this domain
  const userAbility = await getUserAbility(userId)
  const targetDifficulty = userAbility.domain_abilities[domain] || 0.5
  
  // 2. Define difficulty window (±0.15 around student's ability)
  const minDifficulty = Math.max(0.0, targetDifficulty - 0.15)
  const maxDifficulty = Math.min(1.0, targetDifficulty + 0.15)
  
  // 3. Get questions in difficulty range that student hasn't answered recently
  const { data: questions } = await supabase
    .from('questions')
    .select(`
      *,
      question_stats(difficulty_score, confidence_interval)
    `)
    .eq('domain', domain)
    .gte('question_stats.difficulty_score', minDifficulty)
    .lte('question_stats.difficulty_score', maxDifficulty)
    .not('id', 'in', recentlyAnsweredIds)  // exclude recently answered
    .order('question_stats.confidence_interval', { ascending: false })  // prefer high-confidence difficulty scores
    .limit(count * 2)  // fetch extra for filtering
  
  // 4. Prioritize questions near target difficulty
  const sorted = questions.sort((a, b) => {
    const diffA = Math.abs(a.question_stats.difficulty_score - targetDifficulty)
    const diffB = Math.abs(b.question_stats.difficulty_score - targetDifficulty)
    return diffA - diffB
  })
  
  return sorted.slice(0, count)
}
```

### 6.2 Blending with SM-2 Spaced Repetition

**Combined selection logic:**

```javascript
async function getNextQuestions(userId, domain, count = 10) {
  // 1. First, get overdue SM-2 review questions
  const dueQuestions = await getDueReviewQuestions(userId, domain)
  
  // 2. If we have enough due questions, return those
  if (dueQuestions.length >= count) {
    return dueQuestions.slice(0, count)
  }
  
  // 3. Otherwise, fill with adaptive new questions
  const needed = count - dueQuestions.length
  const newQuestions = await selectAdaptiveQuestions(userId, domain, needed)
  
  // 4. Combine and interleave (alternate due and new)
  return interleave(dueQuestions, newQuestions)
}
```

### 6.3 Adaptive Mock Test Module Selection

For Mock Test Mode, use ability score to determine Module 2 difficulty:

```javascript
async function selectModule2Questions(userId, section, module1Score) {
  const userAbility = await getUserAbility(userId)
  const sectionAbility = section === 'reading-writing' 
    ? userAbility.rw_ability 
    : userAbility.math_ability
  
  // Update ability based on Module 1 performance
  const module1Difficulty = calculateModuleDifficulty(module1Score)
  const updatedAbility = updateAbility(sectionAbility, module1Difficulty, module1Score)
  
  // Select Module 2 questions based on updated ability
  let targetDifficulty
  if (module1Score >= 0.70) {
    targetDifficulty = updatedAbility + 0.15  // harder module
  } else {
    targetDifficulty = updatedAbility - 0.15  // easier module
  }
  
  return selectQuestionsAtDifficulty(section, targetDifficulty, 27)  // or 22 for math
}
```

---

## 7. Database Functions & Triggers

### 7.1 Update Question Stats (Trigger)

Automatically update question difficulty when an attempt is recorded:

```sql
-- Function to update question stats after each attempt
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update aggregate counts
  UPDATE question_stats
  SET 
    total_attempts = total_attempts + 1,
    correct_attempts = CASE 
      WHEN NEW.correct THEN correct_attempts + 1 
      ELSE correct_attempts 
    END,
    last_updated = NOW()
  WHERE question_id = NEW.question_id;
  
  -- Calculate new difficulty score
  UPDATE question_stats
  SET 
    difficulty_score = 1.0 - (correct_attempts::numeric / NULLIF(total_attempts, 0)),
    confidence_interval = 1.0 / SQRT(GREATEST(total_attempts, 1)),
    avg_time_spent = (
      SELECT AVG(time_spent) 
      FROM attempts 
      WHERE question_id = NEW.question_id 
        AND time_spent IS NOT NULL
    )
  WHERE question_id = NEW.question_id;
  
  -- If question_stats row doesn't exist yet, create it
  INSERT INTO question_stats (question_id, total_attempts, correct_attempts, difficulty_score)
  VALUES (NEW.question_id, 1, CASE WHEN NEW.correct THEN 1 ELSE 0 END, 0.5)
  ON CONFLICT (question_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on attempts table
CREATE TRIGGER trigger_update_question_stats
  AFTER INSERT ON attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_question_stats();
```

### 7.2 Update User Ability (Function)

Create a database function for consistent ability updates:

```sql
CREATE OR REPLACE FUNCTION update_user_ability(
  p_user_id UUID,
  p_question_id TEXT,
  p_correct BOOLEAN
)
RETURNS TABLE(new_ability NUMERIC, new_domain_ability NUMERIC) AS $$
DECLARE
  v_question RECORD;
  v_user_ability RECORD;
  v_question_difficulty NUMERIC;
  v_current_domain_ability NUMERIC;
  v_learning_rate NUMERIC;
  v_delta NUMERIC;
  v_new_domain_ability NUMERIC;
BEGIN
  -- Get question details
  SELECT q.*, qs.difficulty_score INTO v_question
  FROM questions q
  JOIN question_stats qs ON q.id = qs.question_id
  WHERE q.id = p_question_id;
  
  v_question_difficulty := COALESCE(v_question.difficulty_score, 0.5);
  
  -- Get user's current ability
  SELECT * INTO v_user_ability FROM user_ability WHERE user_id = p_user_id;
  
  -- If no ability record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_ability (user_id) VALUES (p_user_id)
    RETURNING * INTO v_user_ability;
  END IF;
  
  -- Get current domain ability
  v_current_domain_ability := COALESCE(
    (v_user_ability.domain_abilities->>v_question.domain)::NUMERIC,
    0.5
  );
  
  -- Calculate learning rate (decreases with experience)
  v_learning_rate := 0.1 / (1 + SQRT(v_user_ability.questions_answered::NUMERIC / 100.0));
  
  -- Calculate ability delta
  v_delta := (
    CASE WHEN p_correct THEN 1.0 ELSE 0.0 END - v_question_difficulty
  ) * v_learning_rate;
  
  -- Update domain ability
  v_new_domain_ability := GREATEST(0.0, LEAST(1.0, v_current_domain_ability + v_delta));
  
  -- Update user_ability table
  UPDATE user_ability
  SET 
    domain_abilities = jsonb_set(
      domain_abilities,
      ARRAY[v_question.domain],
      to_jsonb(v_new_domain_ability)
    ),
    questions_answered = questions_answered + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Recalculate section and overall abilities
  -- (This is simplified; real implementation would weight by domain)
  UPDATE user_ability
  SET
    rw_ability = (
      COALESCE((domain_abilities->>'craft-and-structure')::NUMERIC, 0.5) +
      COALESCE((domain_abilities->>'information-and-ideas')::NUMERIC, 0.5) +
      COALESCE((domain_abilities->>'standard-english-conventions')::NUMERIC, 0.5) +
      COALESCE((domain_abilities->>'expression-of-ideas')::NUMERIC, 0.5)
    ) / 4.0,
    math_ability = (
      COALESCE((domain_abilities->>'algebra')::NUMERIC, 0.5) +
      COALESCE((domain_abilities->>'advanced-math')::NUMERIC, 0.5) +
      COALESCE((domain_abilities->>'problem-solving-data-analysis')::NUMERIC, 0.5) +
      COALESCE((domain_abilities->>'geometry-trigonometry')::NUMERIC, 0.5)
    ) / 4.0,
    overall_ability = (rw_ability + math_ability) / 2.0
  WHERE user_id = p_user_id;
  
  RETURN QUERY 
  SELECT overall_ability, v_new_domain_ability 
  FROM user_ability 
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Client-side Usage

```javascript
// After student answers a question
const { data: attempt } = await supabase.from('attempts').insert({
  user_id: user.id,
  question_id: questionId,
  correct: isCorrect,
  user_answer: userAnswer,
  confidence_rating: confidenceRating,
  time_spent: timeSpent,
  session_id: sessionId,
  mode: 'practice',
  question_difficulty: currentQuestionDifficulty,
  user_ability_before: currentUserAbility
})

// Trigger updates question_stats automatically
// Now update user ability
const { data: updatedAbility } = await supabase.rpc('update_user_ability', {
  p_user_id: user.id,
  p_question_id: questionId,
  p_correct: isCorrect
})

// Store updated ability in attempt record
await supabase.from('attempts')
  .update({ user_ability_after: updatedAbility[0].new_ability })
  .eq('id', attempt[0].id)
```

---

## 8. Cold Start Problem

### 8.1 Challenge

New questions have no attempts data → difficulty_score = unknown → can't adaptively select them.

### 8.2 Solutions

**Solution 1: Pre-tag difficulty (hybrid approach)**
- Questions start with manually tagged difficulty (easy/medium/hard)
- Convert to initial difficulty_score: easy = 0.25, medium = 0.5, hard = 0.75
- After 10+ attempts, switch to crowd-sourced difficulty
- Set `confidence_interval = 1.0` initially, decreases with attempts

**Solution 2: Exploration bonus**
- Occasionally (5-10% of the time) select a random new question regardless of difficulty
- This ensures all questions get initial data
- Track `confidence_interval` and prefer showing questions with low confidence to gather data

**Solution 3: Seeding phase**
- First 100 users are "seed users" who answer randomly selected questions
- After 100 users × 100 questions = 10,000 attempts, system has enough data
- Then switch to full adaptive mode

**Recommended approach:** Hybrid (Solution 1) + Exploration bonus (Solution 2)

```javascript
async function selectAdaptiveQuestions(userId, domain, count = 10) {
  const userAbility = await getUserAbility(userId)
  const targetDifficulty = userAbility.domain_abilities[domain] || 0.5
  
  // 90% of questions: adaptive selection (near target difficulty)
  const adaptiveCount = Math.floor(count * 0.9)
  const adaptiveQuestions = await selectByDifficulty(domain, targetDifficulty, adaptiveCount)
  
  // 10% of questions: exploration (random new questions with low confidence)
  const explorationCount = count - adaptiveCount
  const explorationQuestions = await selectLowConfidenceQuestions(domain, explorationCount)
  
  return shuffle([...adaptiveQuestions, ...explorationQuestions])
}
```

### 8.3 Initial Question Stats Seeding

When seeding questions into the database:

```sql
INSERT INTO question_stats (question_id, difficulty_score, confidence_interval)
SELECT 
  id,
  CASE difficulty
    WHEN 'easy' THEN 0.25
    WHEN 'medium' THEN 0.5
    WHEN 'hard' THEN 0.75
  END,
  1.0  -- high uncertainty initially
FROM questions;
```

---

## 9. UI/UX Changes

### 9.1 Ability Score Display

**Dashboard widget:**
```
╔════════════════════════════════════╗
║   Your Ability Score               ║
║                                    ║
║   Overall:  ████████░░  72%        ║
║   Reading:  ███████░░░  68%        ║
║   Math:     █████████░  76%        ║
║                                    ║
║   Questions answered: 145          ║
║   Confidence: High ✓               ║
╚════════════════════════════════════╝
```

**Implementation:**
```javascript
// AbilityScoreWidget.jsx
function AbilityScoreWidget({ userAbility }) {
  const confidenceLevel = 
    userAbility.questions_answered < 20 ? 'Low' :
    userAbility.questions_answered < 50 ? 'Medium' : 'High'
  
  return (
    <div className="ability-widget">
      <h3>Your Ability Score</h3>
      <ProgressBar value={userAbility.overall_ability * 100} label="Overall" />
      <ProgressBar value={userAbility.rw_ability * 100} label="Reading" />
      <ProgressBar value={userAbility.math_ability * 100} label="Math" />
      <p>Questions answered: {userAbility.questions_answered}</p>
      <p>Confidence: {confidenceLevel}</p>
    </div>
  )
}
```

### 9.2 Question Difficulty Display

Show crowd-sourced difficulty alongside each question:

```
╔══════════════════════════════════════════════════════╗
║  Question 15 of 20                                   ║
║  Domain: Algebra                                     ║
║  Difficulty: ████████░░ 76% (Hard)                   ║
║  38% of students get this right                      ║
║                                                      ║
║  [Question text here...]                            ║
╚══════════════════════════════════════════════════════╝
```

**After answering:**
```
✓ Correct! Your ability increased: 68% → 71%
  This question is harder than average (76% difficulty)
```

### 9.3 Adaptive Feedback Messages

Provide context about adaptive difficulty:

```javascript
function getAdaptiveFeedback(wasCorrect, questionDifficulty, userAbility) {
  if (wasCorrect) {
    if (questionDifficulty > userAbility + 0.2) {
      return "Impressive! You conquered a challenging question. Your ability score increased significantly."
    } else if (questionDifficulty > userAbility) {
      return "Nice work! You're ready for harder questions."
    } else {
      return "Correct! This was a good reinforcement of your skills."
    }
  } else {
    if (questionDifficulty < userAbility - 0.2) {
      return "This was easier than your usual level. Let's review the fundamentals."
    } else if (questionDifficulty < userAbility) {
      return "Don't worry—even easier questions trip us up sometimes. Review the explanation."
    } else {
      return "This was a challenging question. Your ability score adjusted slightly. Keep practicing!"
    }
  }
}
```

### 9.4 Difficulty Trend Chart

Show how question difficulty has evolved for this user over time:

```
Question Difficulty Over Time
  
  1.0 ┤                                    ╭─╮
      │                               ╭────╯ ╰╮
  0.8 ┤                          ╭────╯       ╰─╮
      │                     ╭────╯              ╰╮
  0.6 ┤                ╭────╯                    ╰─╮
      │           ╭────╯                           ╰╮
  0.4 ┤      ╭────╯                                 ╰─
      │ ╭────╯
  0.2 ┤─╯
      └────────────────────────────────────────────────
        Q1    Q20   Q40   Q60   Q80   Q100  Q120  Q140

  ▢ Your ability score    ── Questions you were shown
```

### 9.5 Domain Ability Radar Chart

Visualize ability across all 8 domains:

```
           Craft & Structure
                  0.72
                   ╱│╲
                  ╱ │ ╲
      Info &     ╱  │  ╲    Grammar
      Ideas  0.68   │   0.81
               ╱    │    ╲
              ╱     │     ╲
             ╱   Overall   ╲
       0.65 ──── (0.72) ──── 0.79
             ╲      │      ╱  Expression
              ╲     │     ╱
               ╲    │    ╱
          0.71  ╲   │   ╱ 0.74
       Advanced  ╲  │  ╱   Problem-
         Math     ╲ │ ╱    Solving
                   ╲│╱
                  0.76
                Algebra
```

---

## 10. Analytics & Insights

### 10.1 Aggregate Question Analytics

**For teachers/admins:**
```sql
-- Find questions that are harder than expected (tagged easy but crowd-sourced hard)
SELECT 
  q.id,
  q.difficulty AS tagged_difficulty,
  qs.difficulty_score AS actual_difficulty,
  qs.total_attempts,
  qs.correct_attempts,
  (qs.correct_attempts::NUMERIC / qs.total_attempts * 100) AS success_rate
FROM questions q
JOIN question_stats qs ON q.id = qs.question_id
WHERE 
  q.difficulty = 'easy' 
  AND qs.difficulty_score > 0.6  -- harder than expected
  AND qs.total_attempts > 50  -- sufficient data
ORDER BY qs.difficulty_score DESC;
```

### 10.2 Student Performance Insights

```sql
-- Show student's performance vs. expected performance
SELECT 
  u.full_name,
  ua.overall_ability,
  COUNT(a.id) AS questions_answered,
  AVG(CASE WHEN a.correct THEN 1.0 ELSE 0.0 END) AS actual_accuracy,
  AVG(1.0 - a.question_difficulty) AS expected_accuracy,
  (AVG(CASE WHEN a.correct THEN 1.0 ELSE 0.0 END) - AVG(1.0 - a.question_difficulty)) AS performance_delta
FROM profiles u
JOIN user_ability ua ON u.id = ua.user_id
JOIN attempts a ON u.id = a.user_id
WHERE a.timestamp > NOW() - INTERVAL '7 days'
GROUP BY u.id, ua.overall_ability
ORDER BY performance_delta DESC;
```

### 10.3 Question Quality Flags

Automatically flag questions that may need review:

```sql
-- Flag questions with unusual statistics
SELECT 
  q.id,
  q.question,
  qs.difficulty_score,
  qs.total_attempts,
  qs.avg_time_spent,
  CASE
    WHEN qs.difficulty_score < 0.1 THEN 'Too Easy - Consider Removing'
    WHEN qs.difficulty_score > 0.9 THEN 'Too Hard - Review Explanation'
    WHEN qs.avg_time_spent < 15 THEN 'Too Fast - Possible Guessing'
    WHEN qs.avg_time_spent > 180 THEN 'Too Slow - Confusing Wording?'
    ELSE 'Normal'
  END AS flag
FROM questions q
JOIN question_stats qs ON q.id = qs.question_id
WHERE qs.total_attempts > 30
  AND (qs.difficulty_score < 0.1 OR qs.difficulty_score > 0.9 OR qs.avg_time_spent < 15 OR qs.avg_time_spent > 180);
```

---

## 11. Performance Optimization

### 11.1 Caching Strategy

**Client-side caching:**
```javascript
// Cache user ability in React state to avoid repeated fetches
const [userAbility, setUserAbility] = useState(null)
const [lastFetched, setLastFetched] = useState(null)

async function fetchUserAbility(userId) {
  // Only fetch if not cached or stale (>5 minutes)
  if (!userAbility || Date.now() - lastFetched > 5 * 60 * 1000) {
    const { data } = await supabase
      .from('user_ability')
      .select('*')
      .eq('user_id', userId)
      .single()
    setUserAbility(data)
    setLastFetched(Date.now())
  }
  return userAbility
}
```

**Server-side caching (Supabase Edge Functions):**
```javascript
// Cache question stats for 5 minutes (they change slowly)
const questionStatsCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

async function getCachedQuestionStats(questionId) {
  const cached = questionStatsCache.get(questionId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const { data } = await supabase
    .from('question_stats')
    .select('*')
    .eq('question_id', questionId)
    .single()
  
  questionStatsCache.set(questionId, { data, timestamp: Date.now() })
  return data
}
```

### 11.2 Batch Updates

Instead of updating ability after every question, batch update every N questions:

```javascript
// Queue ability updates
const abilityUpdateQueue = []

async function recordAttempt(questionId, isCorrect, ...) {
  // Insert attempt to database immediately
  await supabase.from('attempts').insert({ ... })
  
  // Queue ability update
  abilityUpdateQueue.push({ questionId, isCorrect })
  
  // Process queue every 5 questions
  if (abilityUpdateQueue.length >= 5) {
    await processBatchAbilityUpdate(userId, abilityUpdateQueue)
    abilityUpdateQueue.length = 0  // clear queue
  }
}
```

### 11.3 Materialized Views

For expensive aggregate queries, use materialized views:

```sql
-- Materialized view for domain-level statistics (refresh every hour)
CREATE MATERIALIZED VIEW domain_difficulty_stats AS
SELECT 
  domain,
  AVG(difficulty_score) AS avg_difficulty,
  COUNT(*) AS total_questions,
  SUM(total_attempts) AS total_attempts,
  SUM(correct_attempts) AS total_correct
FROM questions q
JOIN question_stats qs ON q.id = qs.question_id
GROUP BY domain;

-- Refresh periodically (can be triggered by cron job)
REFRESH MATERIALIZED VIEW domain_difficulty_stats;

-- Index for fast lookups
CREATE INDEX idx_domain_difficulty_stats_domain ON domain_difficulty_stats(domain);
```

---

## 12. Implementation Phases

### Phase 17: Adaptive Difficulty Foundation

**Phase 17a: Database Setup**
- [ ] Create `question_stats` table
- [ ] Create `user_ability` table
- [ ] Add columns to `attempts` table (question_difficulty, user_ability_before, user_ability_after)
- [ ] Seed `question_stats` with initial difficulty from tagged difficulty (easy/medium/hard)
- [ ] Test RLS policies

**Phase 17b: Database Functions**
- [ ] Create `update_question_stats()` function
- [ ] Create trigger on `attempts` table to call `update_question_stats()`
- [ ] Create `update_user_ability()` function
- [ ] Test functions with sample data

**Phase 17c: Client-side Integration**
- [ ] Create `useUserAbility` React hook
- [ ] Create `useQuestionStats` React hook
- [ ] Refactor question answering flow to call `update_user_ability()` after each attempt
- [ ] Add loading states for ability updates

### Phase 18: Adaptive Question Selection

**Phase 18a: Selection Algorithm**
- [ ] Build `selectAdaptiveQuestions()` function
- [ ] Implement exploration bonus (10% random questions)
- [ ] Test selection with various ability levels

**Phase 18b: Blending with SM-2**
- [ ] Refactor `getNextQuestions()` to blend SM-2 due questions + adaptive new questions
- [ ] Prioritize SM-2 due questions
- [ ] Fill remaining slots with adaptive questions
- [ ] Test interleaving logic

**Phase 18c: Mock Test Adaptation**
- [ ] Update Adaptive Mock Test mode to use ability score for Module 2 selection
- [ ] Test Module 2 difficulty adaptation based on Module 1 performance

### Phase 19: UI Updates

**Phase 19a: Ability Score Widget**
- [ ] Build `AbilityScoreWidget` component
- [ ] Add to dashboard
- [ ] Show overall, section, and domain abilities
- [ ] Add confidence level indicator
- [ ] Add tooltips explaining ability score

**Phase 19b: Question Difficulty Display**
- [ ] Update `QuestionCard` to show crowd-sourced difficulty
- [ ] Display "X% of students get this right"
- [ ] Show difficulty bar alongside question

**Phase 19c: Adaptive Feedback**
- [ ] Build adaptive feedback message generator
- [ ] Display ability change after each question ("68% → 71%")
- [ ] Contextualize feedback based on question difficulty vs ability

**Phase 19d: Analytics Charts**
- [ ] Build difficulty trend chart (line chart showing questions over time)
- [ ] Build domain ability radar chart
- [ ] Add to dashboard and analytics page

### Phase 20: Teacher Analytics (Optional)

**Phase 20a: Aggregate Stats**
- [ ] Build materialized views for class-level statistics
- [ ] Create teacher dashboard widget showing:
  - [ ] Average student ability by domain
  - [ ] Questions with unexpected difficulty
  - [ ] Student performance vs. expected performance

**Phase 20b: Question Quality Flags**
- [ ] Build question flagging algorithm
- [ ] Create admin view for flagged questions
- [ ] Add "Report Question" feature for students

### Phase 21: Performance Optimization

- [ ] Implement client-side caching for user ability
- [ ] Implement server-side caching for question stats
- [ ] Test batch ability updates
- [ ] Optimize database queries with indexes
- [ ] Add database query performance monitoring

### Phase 22: Testing & Validation

- [ ] Unit test difficulty calculation algorithm
- [ ] Unit test ability update algorithm
- [ ] Unit test adaptive selection algorithm
- [ ] Integration test: simulate 100 question attempts, verify ability converges
- [ ] Integration test: verify question difficulty updates correctly
- [ ] Load test: 1000 simultaneous users answering questions
- [ ] Validate that adaptive system improves learning outcomes (A/B test if possible)

---

## 13. Estimated Timeline

| Phase | Time |
|-------|------|
| Phase 17 (Foundation) | 1 week |
| Phase 18 (Selection) | 3–4 days |
| Phase 19 (UI) | 1 week |
| Phase 20 (Teacher Analytics) | 3–4 days (optional) |
| Phase 21 (Optimization) | 2–3 days |
| Phase 22 (Testing) | 3–5 days |
| **Total** | **3–4 weeks** |

---

## 14. Success Metrics

| Metric | Target |
|--------|--------|
| Ability score convergence | Stable within 0.05 after 30 questions |
| Question difficulty accuracy | Crowd-sourced difficulty matches tagged difficulty ±0.15 for 80% of questions |
| Adaptive selection precision | 70%+ of questions shown are within ±0.15 of student ability |
| Learning efficiency | Students reach mastery 20% faster than fixed-difficulty baseline |
| Student satisfaction | "Questions felt appropriately challenging" ≥80% positive |
| Question coverage | All questions receive ≥10 attempts within first month |
| System performance | Ability update latency <500ms, question selection <1s |

---

## 15. Edge Cases & Safeguards

### 15.1 Ability Score Extremes

**Problem:** Student reaches ability = 1.0 or 0.0, no more questions available.

**Solution:**
- Clamp ability updates: `new_ability = Math.max(0.1, Math.min(0.9, new_ability))`
- Always keep some range of questions available
- Show warning: "You've mastered this domain! Try a new domain or take a mock test."

### 15.2 Question Difficulty Outliers

**Problem:** A question has 1 attempt (lucky guess) → difficulty = 0.0, becomes "very easy."

**Solution:**
- Require minimum 10 attempts before trusting crowd-sourced difficulty
- Use confidence_interval to weight tagged vs. crowd-sourced difficulty:
  ```javascript
  const effective_difficulty = 
    confidence_interval * tagged_difficulty + 
    (1 - confidence_interval) * crowd_sourced_difficulty
  ```

### 15.3 Cheating / Data Poisoning

**Problem:** Student randomly guesses to game the system.

**Solution:**
- Track time_spent per question; flag attempts <5 seconds as "rushed"
- Exclude rushed attempts from difficulty calculation
- Weight ability updates by confidence_rating (well-calibrated answers get more weight)

### 15.4 Insufficient Question Pool

**Problem:** Not enough questions at student's ability level in a domain.

**Solution:**
- Widen difficulty window (±0.15 → ±0.25)
- Fallback to random selection from domain if still insufficient
- Show message: "We're running low on questions at your level. Great job!"

---

## 16. Alternative Approaches (Advanced)

### 16.1 Item Response Theory (IRT)

For a more sophisticated model, implement IRT:

- Each question has parameters: difficulty (b), discrimination (a), guessing (c)
- Student ability (θ) estimated via maximum likelihood
- Probability of correct answer: `P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))`

**Pros:** More accurate, handles guessing, allows for harder/easier questions to carry different weight

**Cons:** Complex math, requires more data per question, harder to explain to students

### 16.2 Bayesian Knowledge Tracing (BKT)

Model student knowledge as a probabilistic state machine:

- States: Known / Unknown
- Transitions: Learn, Forget, Slip (wrong despite knowing), Guess (right despite not knowing)
- Update probability of "Known" after each attempt

**Pros:** Handles learning trajectories, tracks mastery over time

**Cons:** Complex, domain-specific parameters needed

**Recommendation:** Start with the simple percentage-based approach described in this document. If you see success and want to improve, implement IRT in Phase 23.

---

## 17. Privacy Considerations

**Aggregate data is anonymized:**
- `question_stats` table has no user identifiers
- Teachers see aggregate statistics only, not individual question attempts
- Students cannot see other students' abilities

**Transparency:**
- Explain to students how adaptive difficulty works
- Show them their ability score and how it changes
- Allow students to reset ability score if they want to start over

---

## Appendix: Sample Queries

### Find hardest questions
```sql
SELECT q.id, q.question, qs.difficulty_score, qs.total_attempts
FROM questions q
JOIN question_stats qs ON q.id = qs.question_id
WHERE qs.total_attempts > 30
ORDER BY qs.difficulty_score DESC
LIMIT 10;
```

### Find students with highest ability
```sql
SELECT p.full_name, ua.overall_ability, ua.questions_answered
FROM profiles p
JOIN user_ability ua ON p.id = ua.user_id
WHERE ua.questions_answered > 50  -- sufficient data
ORDER BY ua.overall_ability DESC
LIMIT 10;
```

### Find questions that are easier/harder than expected
```sql
SELECT 
  q.id,
  q.difficulty AS tagged,
  qs.difficulty_score AS actual,
  ABS(
    CASE q.difficulty
      WHEN 'easy' THEN 0.25
      WHEN 'medium' THEN 0.5
      WHEN 'hard' THEN 0.75
    END - qs.difficulty_score
  ) AS discrepancy
FROM questions q
JOIN question_stats qs ON q.id = qs.question_id
WHERE qs.total_attempts > 30
ORDER BY discrepancy DESC
LIMIT 20;
```

---

**This adaptive difficulty system transforms the app from a static question bank into an intelligent, personalized learning platform that gets smarter as more students use it.**
