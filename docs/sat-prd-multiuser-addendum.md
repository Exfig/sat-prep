# SAT Study App — Multi-User & Deployment Addendum

## Overview

This addendum extends the SAT Study App PRD to support multiple users, cloud deployment, and user management. The original PRD assumed single-user localStorage persistence; this document defines the architecture changes needed for a production-ready, multi-tenant application suitable for school/counselor distribution.

---

## 1. Goals

1. **Multi-user support**: Each student has a separate account with isolated progress data
2. **Cloud accessibility**: App accessible via URL (no local installation)
3. **Data persistence**: Progress stored in cloud database, survives browser/device changes
4. **Privacy & security**: FERPA/COPPA compliant, secure authentication, data isolation
5. **Teacher/counselor view** (optional): Aggregate analytics for educators without exposing individual student data
6. **Scalability**: Support 10–1000+ students without performance degradation

---

## 2. Architecture Overview

### 2.1 Tech Stack Recommendation

**Frontend:**
- React 18+ (unchanged)
- Tailwind CSS (unchanged)
- Deployed on: **Vercel** or **Netlify** (free tier, automatic CI/CD from GitHub)

**Backend & Database:**
- **Supabase** (recommended for speed of development)
  - PostgreSQL database
  - Built-in authentication (email/password, OAuth)
  - Row-level security (RLS) for data isolation
  - Real-time subscriptions (optional)
  - RESTful API + JavaScript client library
  - Free tier: 500MB database, 2GB file storage, 50,000 monthly active users

**Alternative backend options:**
- **Firebase** (easier but less structured, NoSQL)
- **Custom backend** (Node.js/Express + PostgreSQL + Auth0) — more work, more control
- **Vercel Postgres + NextAuth** — good if already using Next.js

**Why Supabase:**
- Fastest time to production (authentication + database in one)
- PostgreSQL handles complex queries for analytics
- Row-level security automatically isolates user data
- Generous free tier
- Easy migration path if you need custom backend later

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Auth UI    │  │ Study Modes │  │ Dashboard/Analytics  │ │
│  │ (Login/    │  │ (Practice,  │  │ (XP, Streaks, Quests)│ │
│  │  Signup)   │  │  Mock Test) │  │                      │ │
│  └────────────┘  └─────────────┘  └──────────────────────┘ │
│         ↓                ↓                    ↓              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Supabase Client Library (JS SDK)             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓  HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Backend                         │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Auth       │  │ PostgreSQL  │  │ Storage (optional)   │ │
│  │ (JWT)      │  │ Database    │  │ (user avatars, etc.) │ │
│  └────────────┘  └─────────────┘  └──────────────────────┘ │
│                                                              │
│  Row-Level Security (RLS) ensures user data isolation       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Core Tables

**users** (handled by Supabase Auth, extended with custom profile)
```sql
-- Supabase auth.users table (managed by Supabase)
-- We extend it with a public.profiles table

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  email TEXT,  -- duplicated from auth for easy access
  avatar_url TEXT,
  role TEXT DEFAULT 'student',  -- 'student', 'teacher', 'admin'
  school TEXT,
  grade_level INTEGER,
  target_test_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

**questions** (read-only reference data, same for all users)
```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,  -- e.g., 'rw-cs-1', 'math-alg-1'
  section TEXT NOT NULL,  -- 'reading-writing' | 'math'
  domain TEXT NOT NULL,
  skill TEXT NOT NULL,
  difficulty TEXT NOT NULL,  -- 'easy' | 'medium' | 'hard'
  type TEXT NOT NULL,  -- 'multiple-choice' | 'grid-in'
  question_text TEXT NOT NULL,
  options JSONB,  -- array of strings for MC
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  related_concepts TEXT[],
  
  -- Passage (for RW)
  passage JSONB,  -- { text, subject, graphic: { type, src, altText, caption } }
  
  -- Learning features
  confusable_group TEXT,
  ei_phase INTEGER DEFAULT 1,
  deep_dive_prompt JSONB,
  hints TEXT[],
  visual_asset JSONB,
  formula_display TEXT,
  requires_think_period BOOLEAN DEFAULT FALSE,
  strategy_tip TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed — read-only for all authenticated users
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are viewable by authenticated users" ON questions FOR SELECT TO authenticated USING (true);
```

**user_progress** (per-user, per-question progress tracking)
```sql
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT REFERENCES questions(id) NOT NULL,
  
  -- Mastery tracking
  mastery_level INTEGER DEFAULT 0,
  last_attempted TIMESTAMPTZ,
  
  -- SM-2 fields
  efactor NUMERIC DEFAULT 2.5,
  interval INTEGER DEFAULT 1,
  repetition INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_quality INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, question_id)
);

-- RLS: Users can only access their own progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_question_id ON user_progress(question_id);
CREATE INDEX idx_user_progress_next_review ON user_progress(user_id, next_review_date);
```

**attempts** (detailed attempt history)
```sql
CREATE TABLE attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT REFERENCES questions(id) NOT NULL,
  
  -- Attempt data
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  correct BOOLEAN NOT NULL,
  user_answer TEXT NOT NULL,
  confidence_rating INTEGER,  -- 1–5
  hints_used INTEGER DEFAULT 0,
  deep_dive_completed BOOLEAN DEFAULT FALSE,
  deep_dive_correct BOOLEAN,
  error_category TEXT,  -- 'silly-mistake' | 'misread' | 'content-gap' | 'time' | 'distractor-trap'
  time_spent INTEGER,  -- seconds
  
  -- Context
  session_id UUID,  -- groups attempts from same study session
  mode TEXT  -- 'practice' | 'weak-areas' | 'domain-review' | 'mixed' | 'timed-module' | 'mock-test' | 'boss-fight'
);

-- RLS
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attempts" ON attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_question_id ON attempts(question_id);
CREATE INDEX idx_attempts_session_id ON attempts(session_id);
CREATE INDEX idx_attempts_timestamp ON attempts(user_id, timestamp DESC);
```

**gamification_state** (XP, levels, streaks, badges)
```sql
CREATE TABLE gamification_state (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- XP & Levels
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  
  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  streak_freezes INTEGER DEFAULT 0,
  
  -- Badges
  badges JSONB DEFAULT '[]'::jsonb,  -- array of { id, name, earnedDate, icon }
  
  -- Quests
  quest_progress JSONB DEFAULT '{}'::jsonb,  -- { domainId: { questionsAnswered, accuracyPercent, ... } }
  section_quests JSONB DEFAULT '{"readingWriting": false, "math": false, "satReady": false}'::jsonb,
  bosses_defeated TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE gamification_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own gamification state" ON gamification_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification state" ON gamification_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification state" ON gamification_state FOR UPDATE USING (auth.uid() = user_id);
```

**exam_wrappers** (post-test reflections)
```sql
CREATE TABLE exam_wrappers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  
  error_breakdown JSONB NOT NULL,  -- { sillyMistake: 2, misread: 1, contentGap: 5, time: 1, distractorTrap: 3 }
  
  UNIQUE(user_id, session_id)
);

-- RLS
ALTER TABLE exam_wrappers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wrappers" ON exam_wrappers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wrappers" ON exam_wrappers FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**mock_tests** (full adaptive test results)
```sql
CREATE TABLE mock_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Scores
  rw_score INTEGER NOT NULL,  -- 200–800
  math_score INTEGER NOT NULL,  -- 200–800
  total_score INTEGER NOT NULL,  -- 400–1600
  
  -- Stats
  questions_correct INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_used INTEGER NOT NULL,  -- seconds
  
  -- Module breakdown
  rw_module1_score NUMERIC,
  rw_module2_score NUMERIC,
  rw_module2_difficulty TEXT,  -- 'easy' | 'hard'
  math_module1_score NUMERIC,
  math_module2_score NUMERIC,
  math_module2_difficulty TEXT
);

-- RLS
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own mock tests" ON mock_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mock tests" ON mock_tests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_mock_tests_user_date ON mock_tests(user_id, date DESC);
```

### 3.2 Teacher/Admin Tables (Optional)

**teacher_student_access** (if implementing teacher view)
```sql
CREATE TABLE teacher_student_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(teacher_id, student_id)
);

-- RLS: Teachers can view their own access grants
-- Students can view teachers who have access to them
ALTER TABLE teacher_student_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view their students" ON teacher_student_access FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view their teachers" ON teacher_student_access FOR SELECT USING (auth.uid() = student_id);
```

---

## 4. Authentication Flow

### 4.1 User Registration

**Sign Up Flow:**
1. Student visits app URL
2. Clicks "Sign Up"
3. Enters: email, password, full name, (optional) school, grade level, target test date
4. Supabase Auth creates user in `auth.users`
5. Trigger/function creates row in `profiles` table
6. Trigger/function creates row in `gamification_state` table
7. User is logged in, redirected to onboarding/dashboard

**Email Verification:** Optional but recommended — Supabase can send verification emails.

### 4.2 Login Flow

1. Student visits app URL
2. If not authenticated, redirected to login page
3. Enters email + password
4. Supabase Auth validates credentials, returns JWT
5. JWT stored in browser (httpOnly cookie or localStorage)
6. All API calls include JWT in Authorization header
7. Supabase validates JWT server-side, applies RLS policies

### 4.3 OAuth (Optional)

For easier signup, support "Sign in with Google":
- Supabase supports Google OAuth out of the box
- Configure OAuth provider in Supabase dashboard
- Add "Sign in with Google" button to login page
- Supabase handles the OAuth flow, creates user, returns JWT

---

## 5. API Design

### 5.1 Supabase Client Integration

**Setup:**
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Authentication:**
```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'student@example.com',
  password: 'securepassword',
  options: {
    data: {  // stored in auth.users.raw_user_meta_data
      full_name: 'Jane Doe',
      school: 'Lincoln High',
      grade_level: 11
    }
  }
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'student@example.com',
  password: 'securepassword'
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

**Database Operations:**
```javascript
// Fetch questions for domain
const { data: questions, error } = await supabase
  .from('questions')
  .select('*')
  .eq('domain', 'algebra')
  .order('difficulty')

// Fetch user progress (RLS automatically filters by user_id)
const { data: progress, error } = await supabase
  .from('user_progress')
  .select('*')
  .eq('question_id', 'math-alg-1')
  .single()

// Update progress after answering a question
const { data, error } = await supabase
  .from('user_progress')
  .upsert({
    user_id: user.id,
    question_id: 'math-alg-1',
    efactor: 2.6,
    interval: 7,
    repetition: 2,
    next_review_date: '2026-02-15',
    last_attempted: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

// Insert attempt
const { data, error } = await supabase
  .from('attempts')
  .insert({
    user_id: user.id,
    question_id: 'math-alg-1',
    correct: true,
    user_answer: 'C',
    confidence_rating: 4,
    hints_used: 0,
    time_spent: 45,
    session_id: currentSessionId,
    mode: 'practice'
  })

// Update gamification state
const { data, error } = await supabase
  .from('gamification_state')
  .update({
    xp: currentXP + 15,
    level: newLevel,
    current_streak: newStreak,
    updated_at: new Date().toISOString()
  })
  .eq('user_id', user.id)
```

### 5.2 Real-time Subscriptions (Optional)

For future features like live leaderboards or collaborative study:
```javascript
// Subscribe to user's own gamification state changes
const channel = supabase
  .channel('gamification-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'gamification_state',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    console.log('XP updated!', payload.new.xp)
  })
  .subscribe()
```

---

## 6. Data Migration Strategy

### 6.1 Migrating from localStorage to Database

For students who used the app before multi-user support:

**Migration Script:**
```javascript
// utils/migrateLocalStorageToSupabase.js
export async function migrateLocalData(userId) {
  const localProgress = JSON.parse(localStorage.getItem('sat-app-progress') || '{}')
  const localGamification = JSON.parse(localStorage.getItem('sat-app-gamification') || '{}')
  
  // Migrate progress
  for (const [questionId, progress] of Object.entries(localProgress)) {
    await supabase.from('user_progress').upsert({
      user_id: userId,
      question_id: questionId,
      ...progress
    })
  }
  
  // Migrate gamification state
  await supabase.from('gamification_state').upsert({
    user_id: userId,
    ...localGamification
  })
  
  // Clear localStorage after successful migration
  localStorage.removeItem('sat-app-progress')
  localStorage.removeItem('sat-app-gamification')
}
```

**Trigger migration on first login:**
- Check if localStorage has data
- Prompt: "We found existing progress. Import it to your account?"
- Run migration script
- Clear localStorage

### 6.2 Seeding Questions

**Load questions into database:**
```javascript
// scripts/seedQuestions.js
import { supabase } from './supabaseAdmin'  // admin client with service_role key
import questions from './questionBank.json'

async function seedQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .upsert(questions, { onConflict: 'id' })
  
  if (error) {
    console.error('Error seeding questions:', error)
  } else {
    console.log(`Seeded ${data.length} questions`)
  }
}

seedQuestions()
```

---

## 7. Privacy & Compliance

### 7.1 FERPA Compliance (Family Educational Rights and Privacy Act)

**Requirements:**
- **Data isolation**: RLS ensures students can't see each other's data ✓
- **Parental access**: If student is under 18, provide mechanism for parent to request data export/deletion
- **Data minimization**: Only collect necessary data (no SSN, no precise location)
- **Secure storage**: Supabase encrypts data at rest and in transit ✓
- **Access controls**: Only authorized users (student, parent, teacher with permission) can access student data

**Implementation:**
- In profiles, add `parent_email` field for under-18 students
- Create "Request My Data" and "Delete My Account" buttons in settings
- Log all data access attempts (Supabase has built-in audit logs)

### 7.2 COPPA Compliance (Children's Online Privacy Protection Act)

**If students under 13 will use the app:**
- **Parental consent required**: Before signup, verify parent email and send consent form
- **Age gate**: Ask birthdate during signup, block under-13 without parental consent
- **Simplified privacy policy**: Explain data collection in parent-friendly language

**Recommended approach for school distribution:**
- Require school counselor/teacher to provision accounts (not self-signup)
- School acts as parent's agent under COPPA
- Include COPPA notice in school distribution agreement

### 7.3 Privacy Policy & Terms of Service

**Must-haves:**
- What data you collect (name, email, study progress, scores)
- How you use it (personalized learning, progress tracking)
- Who can see it (only the student, unless they grant teacher access)
- How long you keep it (until account deletion)
- Third-party services (Supabase hosting)
- Student's rights (access, export, delete)

**Templates available:**
- [Termly](https://termly.io/products/privacy-policy-generator/) — free generator
- [iubenda](https://www.iubenda.com/en/) — paid, more comprehensive

---

## 8. Teacher/Counselor Dashboard (Optional, High-Value Feature)

### 8.1 Teacher Features

**Aggregate Analytics (No Individual PII):**
- Number of students using the app
- Average XP, level, streak across cohort
- Domain-level accuracy trends
- Most challenging questions/domains
- Engagement metrics (days active, questions attempted)

**Class Insights:**
- "30% of students struggle with Algebra domain"
- "Average mock test score: 1180"
- "Top 3 weakest domains: [list]"

**Implementation:**
- Create `teacher_classes` table linking teachers to groups of students
- Create `class_analytics` materialized view with aggregate stats
- Build Teacher Dashboard page with read-only charts
- **Never show individual student names/scores without explicit consent**

### 8.2 Student Consent for Teacher View

**Opt-in Model:**
- In student settings: "Share my progress with my teacher?"
- Student enters teacher's email
- System sends teacher an access request
- Teacher accepts, gets added to `teacher_student_access` table
- Teacher can now view that student's individual dashboard (read-only)

**Implementation:**
```sql
-- View for teachers to see their students' progress (with consent)
CREATE VIEW teacher_student_progress AS
SELECT 
  tsa.teacher_id,
  p.id AS student_id,
  p.full_name AS student_name,
  gs.xp,
  gs.level,
  gs.current_streak,
  mt.total_score AS latest_mock_test_score
FROM teacher_student_access tsa
JOIN profiles p ON tsa.student_id = p.id
JOIN gamification_state gs ON gs.user_id = p.id
LEFT JOIN LATERAL (
  SELECT total_score FROM mock_tests WHERE user_id = p.id ORDER BY date DESC LIMIT 1
) mt ON true;

-- RLS
ALTER VIEW teacher_student_progress OWNER TO authenticated;
GRANT SELECT ON teacher_student_progress TO authenticated;
```

---

## 9. Deployment

### 9.1 Frontend Deployment (Vercel)

**Steps:**
1. Push code to GitHub repository
2. Sign up for Vercel account (free)
3. Import GitHub repo to Vercel
4. Configure environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
5. Deploy (automatic on every push to main branch)
6. Custom domain: `sat-prep.yourdomain.com` or use Vercel's free subdomain

**Vercel benefits:**
- Automatic HTTPS
- Global CDN
- Free tier: Unlimited bandwidth, 100 GB-hours compute
- Automatic preview deployments for pull requests

### 9.2 Backend Deployment (Supabase)

**Steps:**
1. Sign up for Supabase account (free tier: 500MB DB, 2GB storage, 50K MAU)
2. Create new project
3. Run database migrations (see schema SQL above)
4. Configure authentication:
   - Enable email/password auth
   - (Optional) Configure Google OAuth
   - Set redirect URLs (your Vercel domain)
5. Set up Row Level Security policies (see schema above)
6. Seed questions table
7. Copy project URL and anon key to Vercel environment variables

### 9.3 Custom Domain

**For school/counselor distribution:**
- Register domain: `example.com` or use school subdomain
- Configure DNS in Vercel dashboard
- Example: `sat-study.lincolnhigh.edu`

### 9.4 Continuous Integration / Continuous Deployment (CI/CD)

**Automated Testing:**
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

**Automatic Deployment:**
- Vercel automatically deploys on push to `main` branch
- Preview deployments for every pull request
- Roll back to previous deployment in one click

---

## 10. Cost Estimation

### 10.1 Free Tier Limits

| Service | Free Tier | Overage Cost |
|---------|-----------|--------------|
| **Vercel** | Unlimited bandwidth, 100 GB-hours/month | $20/month Pro plan |
| **Supabase** | 500MB DB, 2GB storage, 50K MAU, 2GB egress | $25/month Pro plan |
| **Domain** | $10–15/year | N/A |

**Total estimated cost:**
- **0–100 students**: $0/month (free tier sufficient)
- **100–500 students**: $25–45/month (Supabase Pro if DB grows)
- **500+ students**: $45–70/month (both Pro plans)

### 10.2 Cost Optimization

**Database size optimization:**
- Store only recent attempts (e.g., last 90 days), archive older data
- Use JSONB instead of separate rows for badges/quests
- Compress passage text

**Bandwidth optimization:**
- Enable Vercel caching for static assets
- Lazy-load images/components
- Use Supabase connection pooling

---

## 11. Updated Implementation Phases

### Phase 0: Multi-User Setup (BEFORE Phase 1 of original PRD)

**Phase 0a: Backend Setup**
- [ ] Create Supabase project
- [ ] Run database migrations (create all tables)
- [ ] Configure Row Level Security policies
- [ ] Set up authentication (email/password)
- [ ] (Optional) Configure Google OAuth
- [ ] Test authentication flow in Supabase dashboard
- [ ] Seed questions table (all 300+ questions)

**Phase 0b: Frontend Auth Integration**
- [ ] Install `@supabase/supabase-js`
- [ ] Create Supabase client utility (`src/lib/supabase.js`)
- [ ] Build Auth UI components:
  - [ ] Login page
  - [ ] Signup page
  - [ ] Forgot password page
  - [ ] Email verification flow
- [ ] Build Protected Route wrapper (redirect to login if not authenticated)
- [ ] Add "Sign Out" button to navigation
- [ ] Create user profile page (view/edit profile)

**Phase 0c: Data Layer Refactor**
- [ ] Create database service layer (`src/services/database.js`)
  - [ ] `fetchQuestions(filters)`
  - [ ] `fetchUserProgress(questionId)`
  - [ ] `updateUserProgress(questionId, progressData)`
  - [ ] `insertAttempt(attemptData)`
  - [ ] `fetchGamificationState()`
  - [ ] `updateGamificationState(updates)`
  - [ ] `fetchMockTests()`
  - [ ] `insertMockTest(testData)`
- [ ] Refactor all localStorage calls to use database service layer
- [ ] Add loading states for async data fetches
- [ ] Add error handling for database operations

**Phase 0d: Deployment Setup**
- [ ] Push code to GitHub
- [ ] Create Vercel account
- [ ] Import GitHub repo to Vercel
- [ ] Configure environment variables in Vercel
- [ ] Deploy and test authentication flow
- [ ] (Optional) Configure custom domain
- [ ] Set up CI/CD pipeline

**Phase 0e: Migration & Onboarding**
- [ ] Build localStorage migration utility
- [ ] Add "Import existing progress" prompt on first login
- [ ] Create onboarding flow for new users
  - [ ] Welcome screen
  - [ ] Profile setup (school, grade, target test date)
  - [ ] Feature tour (XP, streaks, quests, mock tests)
- [ ] Add "Request My Data" feature (FERPA compliance)
- [ ] Add "Delete My Account" feature

### Updated Priority

| Priority | Phase | Depends On |
|----------|-------|-----------|
| **P0 — CRITICAL** | **Phase 0 (Multi-User Setup)** | **None — must be first** |
| P0 — Critical | Phase 1 (Setup) | Phase 0 |
| P0 — Critical | Phase 2 (RW Content) | Phase 1 |
| P0 — Critical | Phase 3 (Math Content) | Phase 1 |
| ... | ... (all other phases from original PRD) | ... |

---

## 12. Teacher Dashboard Implementation (Optional, Post-MVP)

### Phase 16: Teacher Features (Optional)

**Phase 16a: Teacher Access System**
- [ ] Create `teacher_classes` table
- [ ] Create `teacher_student_access` table with RLS
- [ ] Build student consent UI: "Share progress with teacher?"
- [ ] Build teacher invitation flow (email-based)
- [ ] Add "My Teachers" section to student settings

**Phase 16b: Teacher Dashboard**
- [ ] Create teacher role check in authentication
- [ ] Build Teacher Dashboard page layout
- [ ] Build aggregate class analytics widget:
  - [ ] Average XP/level/streak
  - [ ] Domain accuracy heatmap
  - [ ] Engagement metrics (active students, avg questions/day)
  - [ ] Mock test score trends
- [ ] Build individual student view (for consented students only)
- [ ] Add "Export Class Report" feature (CSV download)

**Phase 16c: Class Management**
- [ ] Build "Create Class" UI (teacher adds students by email)
- [ ] Build "Join Class" UI (student enters class code)
- [ ] Build class roster page (teacher view)
- [ ] Add class filter to teacher analytics

---

## 13. Security Considerations

### 13.1 Authentication Security

**Best Practices:**
- Use Supabase's built-in JWT authentication (secure by default)
- Enable email verification to prevent fake accounts
- Enforce strong password policy (min 8 chars, complexity rules)
- Rate-limit login attempts (Supabase has built-in rate limiting)
- Use HTTPS only (Vercel provides this automatically)

### 13.2 Database Security

**Row Level Security (RLS):**
- ✓ Users can only read/write their own data
- ✓ Questions table is read-only for all authenticated users
- ✓ Teachers can only view students who granted access

**API Key Security:**
- Never commit Supabase keys to Git
- Use environment variables
- Use Supabase's "anon" key in frontend (safe for public access, RLS applies)
- Keep "service_role" key secret (admin access, only for backend scripts)

### 13.3 Input Validation

**Protect against SQL injection and XSS:**
- Supabase client library uses parameterized queries (safe by default)
- Sanitize user input in profile fields (full_name, school, etc.)
- Validate data types before database insert

### 13.4 Rate Limiting

**Prevent abuse:**
- Supabase has built-in rate limits on auth endpoints
- Add custom rate limiting for expensive operations (e.g., mock test generation)
- Use Vercel's edge middleware for rate limiting (if needed)

---

## 14. Testing Multi-User Setup

### 14.1 Manual Testing Checklist

**Authentication:**
- [ ] Sign up with email/password
- [ ] Receive verification email
- [ ] Log in with correct credentials
- [ ] Login fails with wrong password
- [ ] Forgot password flow works
- [ ] Sign out works
- [ ] Protected routes redirect to login when not authenticated

**Data Isolation:**
- [ ] Create two user accounts
- [ ] User A completes questions, gains XP
- [ ] Log in as User B
- [ ] Verify User B sees no progress from User A
- [ ] Verify User B cannot access User A's data via API calls

**Progress Persistence:**
- [ ] Complete questions as User A
- [ ] Sign out
- [ ] Sign in as User A on different browser/device
- [ ] Verify progress is restored

### 14.2 Automated Testing

**Sample test (using Jest + Supabase):**
```javascript
// tests/auth.test.js
import { supabase } from '../src/lib/supabase'

describe('Authentication', () => {
  it('should create a new user', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'SecurePass123!'
    })
    expect(error).toBeNull()
    expect(data.user).toBeDefined()
  })

  it('should enforce RLS on user_progress', async () => {
    // Sign in as User A
    await supabase.auth.signInWithPassword({
      email: 'userA@example.com',
      password: 'password'
    })
    
    // Try to fetch User B's progress (should return empty)
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', 'user-b-uuid')
    
    expect(data).toHaveLength(0)  // RLS blocks access
  })
})
```

---

## 15. Launch Checklist

**Before sharing with counselor/students:**

### Technical:
- [ ] All database tables created with RLS enabled
- [ ] Questions seeded (all 300+)
- [ ] Authentication working (signup, login, logout)
- [ ] Data isolation verified (manual test with 2+ users)
- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (HTTPS)
- [ ] Mobile responsive design tested
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### Legal & Compliance:
- [ ] Privacy Policy page published
- [ ] Terms of Service page published
- [ ] COPPA/FERPA compliance review (if under-18 students)
- [ ] Parental consent mechanism (if under-13 students)
- [ ] "Request My Data" feature implemented
- [ ] "Delete My Account" feature implemented

### Content & UX:
- [ ] Onboarding flow for new users
- [ ] Help/FAQ page
- [ ] Contact/support email listed
- [ ] All question explanations reviewed for accuracy
- [ ] All visual assets tested and working

### Communication:
- [ ] Prepare distribution email for counselor
- [ ] Include app URL, signup instructions, and feature overview
- [ ] Offer to present/demo to students
- [ ] Set up feedback collection mechanism (Google Form, Typeform, etc.)

---

## 16. Success Metrics (Multi-User)

| Metric | Target |
|--------|--------|
| User signups (first month) | 20–50 students |
| User retention (return after 7 days) | ≥60% |
| Average session length | ≥10 minutes |
| Questions answered per user per week | ≥50 |
| Mock tests completed per user before exam | ≥3 |
| Average mock test score improvement | ≥80 points |
| Crash/error rate | <1% |
| Page load time (dashboard) | <2 seconds |
| Database query time (p95) | <500ms |

---

## 17. Roadmap for Future Enhancements

**Post-Launch (after 2 months, after initial SAT exam):**

### 17.1 Social Features
- [ ] Study groups / collaborative practice
- [ ] Friend leaderboard (opt-in)
- [ ] Shared progress (students can compare with friends)
- [ ] Badges for team achievements

### 17.2 Advanced Analytics
- [ ] Predictive score estimation (ML model)
- [ ] Personalized study plans based on weak areas
- [ ] Time-to-goal tracker ("You're on track for a 1400 by March")

### 17.3 Content Expansion
- [ ] Additional 200+ questions
- [ ] Video explanations for hard questions
- [ ] Flashcard mode for vocabulary/formulas
- [ ] Study guide PDFs (generated from weak domains)

### 17.4 Integration Features
- [ ] Google Classroom integration (roster import)
- [ ] Canvas/Schoology LTI integration
- [ ] Export progress to PDF for college applications

---

## Appendix A: Sample Environment Variables

```bash
# .env (local development)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vercel environment variables (production)
# Set these in Vercel dashboard under Settings > Environment Variables
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Appendix B: Supabase Setup Quickstart

**5-minute setup guide:**

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Run SQL migrations**: Copy schema from §3 into SQL Editor
3. **Enable Auth**: Settings > Authentication > Enable Email provider
4. **Copy credentials**: Settings > API > Copy URL and anon key
5. **Test connection**: 
   ```javascript
   import { createClient } from '@supabase/supabase-js'
   const supabase = createClient('YOUR_URL', 'YOUR_ANON_KEY')
   const { data } = await supabase.auth.getSession()
   console.log(data)
   ```

---

## Appendix C: Estimated Development Timeline

With multi-user support:

| Phase | Estimated Time |
|-------|---------------|
| Phase 0 (Multi-user setup) | 1 week |
| Phase 1–3 (Setup + Content) | 2–3 weeks |
| Phase 4–6 (Core + Gamification) | 2 weeks |
| Phase 7–11 (Features + Dashboard) | 2 weeks |
| Phase 12–13 (Content Enrichment) | 1 week |
| Phase 14 (Testing) | 3–5 days |
| Phase 15 (Deployment) | 2 days |
| **Total** | **7–8 weeks** |

---

**This multi-user architecture ensures the app is production-ready for school distribution, FERPA/COPPA compliant, and scalable from 10 to 1000+ students.**
