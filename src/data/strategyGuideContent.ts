// Strategy Guide Content — 5 Chapters, 17 Sections, ~40 Quiz Questions
// Based on "SAT Prep and Test Strategies" research document

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Section {
  id: string;
  title: string;
  content: string[];       // paragraphs of teaching content
  keyPoints: string[];     // callout box bullet points
  quiz: QuizQuestion[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: string;
  sections: Section[];
}

export const STRATEGY_GUIDE_CHAPTERS: Chapter[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHAPTER 1 — Understanding the Digital SAT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'ch1',
    number: 1,
    title: 'Understanding the Digital SAT',
    description: 'Learn about the test structure, adaptive testing, and how scores work.',
    icon: '\u{1F4CB}',
    sections: [
      {
        id: 'ch1-s1',
        title: 'Test Structure Overview',
        content: [
          'The digital SAT is divided into two main sections: Reading and Writing (RW) and Math. Each section contains two modules, giving you four modules total. The entire test takes 2 hours and 14 minutes (134 minutes).',
          'The Reading and Writing section has two modules of 27 questions each (54 total), with 32 minutes per module. Every RW question is paired with a short passage\u2014sometimes just a few sentences. No more long, multi-paragraph reading comprehension passages.',
          'The Math section also has two modules: the first has 22 questions in 35 minutes, and the second has 22 questions in 35 minutes (44 total). About 75% of math questions are multiple-choice (4 options) and 25% are student-produced responses (grid-in). You get an on-screen Desmos graphing calculator for the entire math section.',
          'In total, you will answer 98 questions across 134 minutes. There is a 10-minute break between the RW and Math sections.',
        ],
        keyPoints: [
          '2 sections: Reading & Writing (54 Qs, 64 min) + Math (44 Qs, 70 min)',
          'Each section has 2 modules with a 10-minute break between sections',
          '98 questions total in 134 minutes',
          'Every RW question has its own short passage',
          'On-screen Desmos calculator for all math questions',
        ],
        quiz: [
          {
            id: 'ch1-s1-q1',
            question: 'How many total questions are on the digital SAT?',
            options: ['88', '98', '108', '154'],
            correctIndex: 1,
            explanation: 'The digital SAT has 98 questions total: 54 in Reading & Writing and 44 in Math.',
          },
          {
            id: 'ch1-s1-q2',
            question: 'How long is the total testing time for the digital SAT?',
            options: ['2 hours', '2 hours 14 minutes', '2 hours 45 minutes', '3 hours'],
            correctIndex: 1,
            explanation: 'The digital SAT takes 2 hours and 14 minutes (134 minutes) of testing time, plus a 10-minute break.',
          },
          {
            id: 'ch1-s1-q3',
            question: 'What tool is available for ALL math questions on the digital SAT?',
            options: ['A physical calculator', 'An on-screen Desmos graphing calculator', 'A basic four-function calculator', 'No calculator is allowed'],
            correctIndex: 1,
            explanation: 'The digital SAT provides an on-screen Desmos graphing calculator for the entire math section.',
          },
        ],
      },
      {
        id: 'ch1-s2',
        title: 'How Adaptive Testing Works',
        content: [
          'The digital SAT uses multi-stage adaptive testing (MST). This means the difficulty of Module 2 adapts based on your performance in Module 1. Both modules within a section contribute to your final score.',
          'In each section, Module 1 contains a mix of easy, medium, and hard questions. Based on your Module 1 performance, you are routed to either a harder or easier Module 2. If you perform well on Module 1 (roughly 70%+ correct), you get the harder Module 2, which gives you access to the full score range (up to 800). If you struggle on Module 1, you get the easier Module 2, which caps your score for that section lower.',
          'This is why your Module 1 performance is critical. Missing too many questions in Module 1 can permanently limit your maximum score for that section. Think of Module 1 as the "gateway" \u2014 strong performance here opens the door to top scores.',
          'Important: You cannot go back to Module 1 once you move to Module 2. Every question in Module 1 matters.',
        ],
        keyPoints: [
          'Module 2 difficulty adapts based on your Module 1 performance',
          'Strong Module 1 (~70%+) = harder Module 2 = access to full 800 score range',
          'Weak Module 1 = easier Module 2 = score ceiling is lower',
          'You cannot return to Module 1 after advancing',
          'Every Module 1 question matters \u2014 treat it as the gateway',
        ],
        quiz: [
          {
            id: 'ch1-s2-q1',
            question: 'What happens if you perform well on Module 1?',
            options: [
              'You skip Module 2 entirely',
              'You get a harder Module 2 with access to the full score range',
              'Module 2 stays the same difficulty',
              'You earn bonus points',
            ],
            correctIndex: 1,
            explanation: 'Strong Module 1 performance routes you to a harder Module 2, which gives access to the full 200-800 score range for that section.',
          },
          {
            id: 'ch1-s2-q2',
            question: 'Can you go back to Module 1 after starting Module 2?',
            options: ['Yes, at any time', 'Only if you finish Module 2 early', 'No, you cannot return', 'Only during the break'],
            correctIndex: 2,
            explanation: 'Once you advance to Module 2, you cannot return to Module 1. This is why every Module 1 question matters.',
          },
        ],
      },
      {
        id: 'ch1-s3',
        title: 'Scoring: How Your Score Is Calculated',
        content: [
          'Your SAT score ranges from 400 to 1600, combining two section scores of 200-800 each (Reading & Writing and Math). There is no penalty for wrong answers, so you should answer every question even if you need to guess.',
          'The scoring algorithm considers both the number of correct answers and the difficulty of questions you answered correctly. Getting harder questions right is worth more than easier ones. This is why the adaptive routing matters \u2014 students in the harder Module 2 have access to questions that are worth more.',
          'Because there is no guessing penalty, you should never leave a question blank. If you are running out of time, quickly select answers for any remaining questions. Even random guesses give you a 25% chance on multiple-choice questions.',
          'Your score report will include a total score (400-1600), section scores (200-800 each), and test percentiles. Scores are typically available within a few weeks of testing.',
        ],
        keyPoints: [
          'Score range: 400-1600 (two sections of 200-800)',
          'No penalty for wrong answers \u2014 never leave a question blank',
          'Harder questions are worth more toward your score',
          'Always guess if unsure \u2014 25% chance on multiple-choice',
          'Scores available within a few weeks',
        ],
        quiz: [
          {
            id: 'ch1-s3-q1',
            question: 'Is there a penalty for guessing on the digital SAT?',
            options: ['Yes, \u00BC point deduction', 'Yes, \u00BD point deduction', 'No penalty for wrong answers', 'Only on grid-in questions'],
            correctIndex: 2,
            explanation: 'There is no guessing penalty on the digital SAT. You should always answer every question, even if you need to guess.',
          },
          {
            id: 'ch1-s3-q2',
            question: 'What is the total score range for the digital SAT?',
            options: ['200-800', '400-1600', '600-2400', '0-1600'],
            correctIndex: 1,
            explanation: 'The SAT total score ranges from 400 to 1600, combining two section scores of 200-800 each.',
          },
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHAPTER 2 — Building Your Study Plan
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'ch2',
    number: 2,
    title: 'Building Your Study Plan',
    description: 'Create an effective timeline and weekly study routine for SAT success.',
    icon: '\u{1F4C5}',
    sections: [
      {
        id: 'ch2-s1',
        title: 'Setting Your Timeline',
        content: [
          'Most students benefit from a 12-20 week study plan. This gives enough time to build skills without burning out. Start by identifying your test date and working backward to create a schedule.',
          'Begin with a diagnostic test to establish your baseline score. This helps you understand where you stand and which areas need the most work. Take a full-length practice test under realistic conditions \u2014 timed, with no interruptions.',
          'Set a realistic target score based on your diagnostic results and the schools you are applying to. A 100-200 point improvement is achievable for most students with consistent practice. Larger gains are possible but require more intensive preparation.',
        ],
        keyPoints: [
          'Plan for 12-20 weeks of preparation',
          'Start with a diagnostic test to find your baseline',
          'Set a target score based on your goals and diagnostic results',
          '100-200 point improvement is realistic with consistent practice',
          'Work backward from your test date',
        ],
        quiz: [
          {
            id: 'ch2-s1-q1',
            question: 'What should you do first when starting your SAT preparation?',
            options: [
              'Memorize vocabulary words',
              'Take a diagnostic practice test',
              'Buy every prep book available',
              'Start with the hardest practice questions',
            ],
            correctIndex: 1,
            explanation: 'Starting with a diagnostic test establishes your baseline score so you know which areas need the most improvement.',
          },
          {
            id: 'ch2-s1-q2',
            question: 'How long should a typical SAT study plan be?',
            options: ['2-4 weeks', '6-8 weeks', '12-20 weeks', '6-12 months'],
            correctIndex: 2,
            explanation: 'A 12-20 week plan gives enough time to build skills without burning out, and allows for a steady improvement trajectory.',
          },
        ],
      },
      {
        id: 'ch2-s2',
        title: 'Weekly Study Routine',
        content: [
          'Plan to study 2-3 hours per week at minimum, spread across at least 3 sessions. Shorter, more frequent sessions are more effective than one long cram session. Consistency beats intensity.',
          'A good weekly routine includes: 1-2 sessions of targeted practice (focusing on your weak areas), 1 session of review (going over mistakes and understanding why you got them wrong), and optional timed practice to build pacing skills.',
          'After each practice session, spend time reviewing your errors. Do not just check the answer \u2014 understand WHY the correct answer is correct and WHY your answer was wrong. This error analysis is the most valuable part of your study.',
          'Every 2-3 weeks, take a full-length practice test to track your progress and adjust your study plan as needed.',
        ],
        keyPoints: [
          'Minimum 2-3 hours per week across 3+ sessions',
          'Shorter, frequent sessions beat one long cram session',
          'Mix targeted practice, review, and timed practice',
          'Error analysis is the most valuable study activity',
          'Take a practice test every 2-3 weeks to track progress',
        ],
        quiz: [
          {
            id: 'ch2-s2-q1',
            question: 'What is the MOST valuable study activity for SAT preparation?',
            options: [
              'Answering as many questions as possible',
              'Error analysis \u2014 understanding why answers are wrong',
              'Memorizing formulas',
              'Reading test prep books cover to cover',
            ],
            correctIndex: 1,
            explanation: 'Error analysis is the most valuable study activity. Understanding WHY you missed a question helps you avoid the same mistake in the future.',
          },
        ],
      },
      {
        id: 'ch2-s3',
        title: 'Using This App Effectively',
        content: [
          'This app is designed to maximize your study efficiency with features that mirror proven study techniques. Here is how to get the most out of each feature.',
          'Start with Domain Review mode to build foundational knowledge in each area. Once you feel comfortable, use Spaced Review to reinforce what you have learned using scientifically-proven spacing intervals. The app tracks your mastery and schedules reviews automatically.',
          'Use Timed Module practice to build pacing skills \u2014 this simulates real test conditions with the same number of questions and time limits. The Adaptive Mock Test gives you the full SAT experience with adaptive difficulty between modules.',
          'Check your Dashboard regularly for weak areas and due reviews. The Quest system and XP rewards help keep you motivated, but remember: consistent, thoughtful practice is what drives real improvement.',
        ],
        keyPoints: [
          'Start with Domain Review for each area',
          'Use Spaced Review to reinforce with scientific spacing',
          'Practice with Timed Modules to build pacing skills',
          'Take Adaptive Mock Tests for full SAT simulation',
          'Check Dashboard for weak areas and due reviews',
        ],
        quiz: [
          {
            id: 'ch2-s3-q1',
            question: 'What study mode should you start with when beginning a new domain?',
            options: ['Timed Module', 'Boss Fight', 'Domain Review', 'Adaptive Mock Test'],
            correctIndex: 2,
            explanation: 'Domain Review mode helps build foundational knowledge in each area before moving to more challenging practice modes.',
          },
          {
            id: 'ch2-s3-q2',
            question: 'What makes Spaced Review effective?',
            options: [
              'It uses longer passages',
              'It reviews material at scientifically-proven spacing intervals',
              'It only shows easy questions',
              'It times you strictly',
            ],
            correctIndex: 1,
            explanation: 'Spaced Review uses scientifically-proven spacing intervals to schedule reviews at the optimal time for long-term retention.',
          },
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHAPTER 3 — Reading & Writing Strategies
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'ch3',
    number: 3,
    title: 'Reading & Writing Strategies',
    description: 'Master the Grammar-First maneuver, pacing rules, and evidence strategies.',
    icon: '\u{1F4D6}',
    sections: [
      {
        id: 'ch3-s1',
        title: 'The Grammar-First Maneuver',
        content: [
          'One of the most powerful RW strategies is the Grammar-First maneuver. Instead of working through questions in order, scan through the module and answer all grammar/conventions questions FIRST. These are typically faster and more predictable than reading comprehension questions.',
          'Grammar questions (Standard English Conventions) ask about sentence structure, punctuation, verb forms, and pronoun agreement. They usually take 30-60 seconds each. By doing these first, you bank time that you can spend on harder reading comprehension questions later.',
          'To identify grammar questions quickly: look for answer choices that differ only in punctuation, verb tense, or word form. If the choices are short phrases that look similar, it is likely a conventions question. Get these done quickly and accurately first, then return to the passage-based questions.',
          'This strategy works because grammar rules are consistent and learnable. Once you know the rules, these questions become fast and reliable points.',
        ],
        keyPoints: [
          'Answer all grammar/conventions questions FIRST in each module',
          'Grammar questions are faster (30-60 sec) and more predictable',
          'Identify them by short, similar-looking answer choices',
          'Bank extra time for harder reading comprehension questions',
          'Grammar rules are consistent and learnable \u2014 reliable points',
        ],
        quiz: [
          {
            id: 'ch3-s1-q1',
            question: 'What is the Grammar-First maneuver?',
            options: [
              'Studying grammar before reading',
              'Answering grammar questions before reading comprehension in each module',
              'Only studying grammar rules',
              'Skipping all grammar questions',
            ],
            correctIndex: 1,
            explanation: 'The Grammar-First maneuver means scanning the module and answering grammar/conventions questions first, then returning to reading comprehension.',
          },
          {
            id: 'ch3-s1-q2',
            question: 'How can you quickly identify a grammar question?',
            options: [
              'It has a long passage',
              'The answer choices differ mainly in punctuation, verb tense, or word form',
              'It asks about the main idea',
              'It references a study or data',
            ],
            correctIndex: 1,
            explanation: 'Grammar questions typically have short answer choices that differ only in punctuation, verb tense, or word form.',
          },
        ],
      },
      {
        id: 'ch3-s2',
        title: 'The "14 and 12" Pacing Rule',
        content: [
          'Each RW module gives you 32 minutes for 27 questions. The "14 and 12" pacing rule helps you manage your time effectively. Aim to complete the first 14 questions in about 14 minutes, leaving 18 minutes for the remaining 13 questions.',
          'Why this split? The earlier questions in each module tend to be easier and faster. By moving through them efficiently, you save more time for the harder questions that come later. This is especially important after using the Grammar-First maneuver.',
          'If you find yourself spending more than 2 minutes on any single RW question, mark it for review and move on. You can come back to it if you have time at the end. Getting stuck on one hard question can cost you several easier questions.',
          'Practice pacing during your study sessions. Use the Timed Module mode in this app to build your internal clock. With practice, you will develop a natural sense of when to move on.',
        ],
        keyPoints: [
          'Target: first 14 questions in ~14 minutes, rest in ~18 minutes',
          'Earlier questions tend to be easier \u2014 move through them quickly',
          'Never spend more than 2 minutes on one RW question',
          'Mark difficult questions for review and move on',
          'Practice pacing with Timed Module mode',
        ],
        quiz: [
          {
            id: 'ch3-s2-q1',
            question: 'According to the "14 and 12" rule, how should you split your time in an RW module?',
            options: [
              'Equal time for all questions',
              'First 14 questions in ~14 min, remaining 13 in ~18 min',
              'First 12 questions in 14 min, remaining 15 in 18 min',
              'Spend 1 minute per question exactly',
            ],
            correctIndex: 1,
            explanation: 'The "14 and 12" rule suggests completing the first 14 questions in about 14 minutes and using the remaining 18 minutes for the last 13 questions.',
          },
          {
            id: 'ch3-s2-q2',
            question: 'What should you do if you spend more than 2 minutes on a single RW question?',
            options: [
              'Keep working until you solve it',
              'Leave it blank',
              'Mark it for review and move on',
              'Guess randomly and move on',
            ],
            correctIndex: 2,
            explanation: 'Mark the question for review and move on. You can return to it if time permits. Getting stuck costs you points on easier questions.',
          },
        ],
      },
      {
        id: 'ch3-s3',
        title: 'The Question-First Reading Method',
        content: [
          'For reading comprehension questions, try the Question-First method: read the question and answer choices BEFORE reading the passage. This gives you a specific purpose when reading, so you can focus on finding relevant information instead of trying to absorb everything.',
          'When you know what the question is asking, you can read the passage with a targeted lens. For example, if the question asks about the author\'s tone, you will naturally pay attention to word choice and attitude as you read. If it asks about a specific detail, you can scan for that information.',
          'This is especially powerful for inference and evidence-based questions. Knowing what you are looking for before reading turns passive reading into active searching, which is both faster and more accurate.',
          'For questions about vocabulary in context, focus on the sentence containing the word and its surrounding context. The correct meaning is always supported by the passage \u2014 do not rely on the most common meaning of the word.',
        ],
        keyPoints: [
          'Read the question and choices BEFORE the passage',
          'Gives you a specific purpose and focus while reading',
          'Turns passive reading into active searching',
          'Especially effective for inference and evidence questions',
          'For vocabulary-in-context, focus on surrounding sentences',
        ],
        quiz: [
          {
            id: 'ch3-s3-q1',
            question: 'What is the Question-First reading method?',
            options: [
              'Answering questions without reading the passage',
              'Reading the question and choices before reading the passage',
              'Only reading the first question',
              'Reading passages twice before answering',
            ],
            correctIndex: 1,
            explanation: 'The Question-First method means reading the question and answer choices before the passage, giving you a focused purpose while reading.',
          },
        ],
      },
      {
        id: 'ch3-s4',
        title: 'Evidence and Rhetorical Synthesis',
        content: [
          'The "Goldilocks" evidence strategy helps with evidence-based questions. The correct evidence is never too broad (supports the general topic but not the specific claim) and never too narrow (mentions only a small detail). Look for the answer that is "just right" \u2014 directly and specifically supports the claim in question.',
          'When evaluating evidence choices, ask: "Does this DIRECTLY prove the specific point being made?" If the evidence only loosely relates to the topic, it is too broad. If it proves a different or more limited point, it is too narrow.',
          'For rhetorical synthesis questions, you may see data from tables, charts, or research notes that you need to integrate with textual information. Read the data carefully and match it to the answer choice that accurately represents both the data and the rhetorical goal.',
          'Annotation can help: mentally (or using the highlight tool) mark key claims, transitions, and evidence as you read. This makes it faster to find and evaluate evidence when answering questions.',
        ],
        keyPoints: [
          'Goldilocks evidence: not too broad, not too narrow, "just right"',
          'Ask: "Does this DIRECTLY prove the specific claim?"',
          'For synthesis questions, match data to both accuracy AND rhetorical goal',
          'Annotate key claims and evidence as you read',
          'Too-broad evidence relates to the topic but not the specific point',
        ],
        quiz: [
          {
            id: 'ch3-s4-q1',
            question: 'In the "Goldilocks" evidence strategy, what makes evidence "too broad"?',
            options: [
              'It is factually incorrect',
              'It supports the general topic but not the specific claim',
              'It is too long',
              'It contradicts the passage',
            ],
            correctIndex: 1,
            explanation: 'Evidence that is "too broad" relates to the general topic but does not directly support the specific claim being made.',
          },
          {
            id: 'ch3-s4-q2',
            question: 'What should you focus on in rhetorical synthesis questions?',
            options: [
              'Only the textual passage',
              'Only the data or chart',
              'Both accuracy of data representation AND the rhetorical goal',
              'The author\'s biography',
            ],
            correctIndex: 2,
            explanation: 'Rhetorical synthesis requires matching data to answer choices that are both factually accurate AND serve the stated rhetorical purpose.',
          },
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHAPTER 4 — Math Strategies & Desmos
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'ch4',
    number: 4,
    title: 'Math Strategies & Desmos',
    description: 'Learn Desmos power moves, back-solving, and math pacing techniques.',
    icon: '\u{1F4CA}',
    sections: [
      {
        id: 'ch4-s1',
        title: 'Desmos Power Moves',
        content: [
          'The on-screen Desmos graphing calculator is one of your most powerful tools on the math section. Learning to use it effectively can save you significant time and help you solve problems you might otherwise struggle with algebraically.',
          'Systems of equations: Instead of solving algebraically, graph both equations in Desmos and find their intersection point. Click the intersection to get the exact coordinates. This works for linear, quadratic, and even more complex systems.',
          'Regression and curve fitting: If a question gives you data points and asks for a trend or equation, enter the points as a table in Desmos. Then try regression commands like y\u2081 ~ mx\u2081 + b (linear) or y\u2081 ~ ax\u2081\u00B2 + bx\u2081 + c (quadratic) to find the best-fit equation.',
          'Sliders and exploration: When a question has parameters (like y = ax + b where a is unknown), type the equation with the parameter and Desmos will offer to create a slider. Adjust the slider to match given conditions and read off the answer.',
        ],
        keyPoints: [
          'Graph systems of equations to find intersection points visually',
          'Use regression (y\u2081 ~ mx\u2081 + b) for data-fitting questions',
          'Create sliders for parameter exploration',
          'Click intersections for exact coordinate values',
          'Desmos can replace complex algebra with visual solutions',
        ],
        quiz: [
          {
            id: 'ch4-s1-q1',
            question: 'How can you solve a system of equations quickly using Desmos?',
            options: [
              'Use the solver function',
              'Graph both equations and find their intersection point',
              'Convert them to matrices',
              'Type "solve" into Desmos',
            ],
            correctIndex: 1,
            explanation: 'Graph both equations in Desmos and click the intersection point to get the exact coordinates of the solution.',
          },
          {
            id: 'ch4-s1-q2',
            question: 'What Desmos feature helps when a question has an unknown parameter?',
            options: ['The table function', 'Sliders', 'The regression line', 'The zoom tool'],
            correctIndex: 1,
            explanation: 'When you type an equation with a parameter, Desmos offers to create a slider that lets you adjust the value and find the answer visually.',
          },
        ],
      },
      {
        id: 'ch4-s2',
        title: 'Plugging In and Back-Solving (PIN Strategy)',
        content: [
          'The PIN (Plug In Numbers) strategy is a powerful alternative to algebraic solving. When a question uses variables or abstract expressions, plug in simple, concrete numbers to test each answer choice. Choose numbers like 2, 3, or 5 that are easy to work with.',
          'For "which must be true" questions, plug in several different numbers (including negatives, fractions, and zero) to eliminate choices that fail. The correct answer must work for ALL cases.',
          'Back-solving works for multiple-choice questions where the answer choices are numbers. Start with choice B or C (the middle values), plug the value back into the problem, and check if it works. This binary search approach usually finds the answer in 1-2 tries.',
          'When back-solving, if the answer you tried is too small, try a larger choice; if too large, try smaller. This strategic approach is often faster than setting up and solving equations from scratch.',
        ],
        keyPoints: [
          'PIN strategy: plug in simple numbers (2, 3, 5) for variable questions',
          'For "must be true" questions, test multiple number types',
          'Back-solve: start with middle answer choices (B or C)',
          'If result is too large/small, adjust direction accordingly',
          'Often faster than pure algebraic solving',
        ],
        quiz: [
          {
            id: 'ch4-s2-q1',
            question: 'When using the back-solving strategy, which answer choice should you start with?',
            options: [
              'Always choice A',
              'Always choice D',
              'A middle value (B or C)',
              'The largest value',
            ],
            correctIndex: 2,
            explanation: 'Start with a middle value (B or C) so you can determine if you need a larger or smaller answer, narrowing it down efficiently.',
          },
          {
            id: 'ch4-s2-q2',
            question: 'For a "which must be true" question, what should you plug in?',
            options: [
              'Only positive integers',
              'Only the number 1',
              'Several different types: negatives, fractions, zero, and positives',
              'Only the answer choices',
            ],
            correctIndex: 2,
            explanation: 'Test multiple number types (negatives, fractions, zero, positives) because the correct answer must work for ALL cases, not just one.',
          },
        ],
      },
      {
        id: 'ch4-s3',
        title: 'The "12 and 24" Math Pacing Rule',
        content: [
          'Each Math module has 22 questions in 35 minutes. The "12 and 24" pacing rule suggests spending roughly 12 minutes on the first 12 questions and 24 minutes on the remaining 10 questions (rounding slightly).',
          'Like the RW section, earlier math questions tend to be easier. Move through the straightforward questions quickly to bank time for the challenging problems at the end. A good target is about 1 minute per easy question and 2-3 minutes per hard question.',
          'For grid-in (student-produced response) questions, double-check your entry format. Make sure decimals and fractions are entered correctly. Common mistakes include entering a fraction when a decimal is expected, or rounding incorrectly. If a question says "round to the nearest tenth," follow the instruction exactly.',
          'If a question stumps you, do not waste time staring at it. Make your best guess, flag it, and move on. You can always return to flagged questions if you have time remaining.',
        ],
        keyPoints: [
          'Target: first 12 questions in ~12 min, remaining 10 in ~24 min',
          '~1 min per easy question, 2-3 min per hard question',
          'Double-check grid-in format (decimals, fractions, rounding)',
          'Flag and move on if stuck \u2014 return later if time allows',
          'Never leave a question blank (no guessing penalty)',
        ],
        quiz: [
          {
            id: 'ch4-s3-q1',
            question: 'According to the "12 and 24" rule, how should you split your time in a Math module?',
            options: [
              'Equal time for all questions',
              'First 12 questions in ~12 min, remaining 10 in ~24 min',
              'First 6 questions in 12 min, remaining 16 in 24 min',
              'Spend 2 minutes per question exactly',
            ],
            correctIndex: 1,
            explanation: 'The "12 and 24" rule allocates about 12 minutes for the first 12 (generally easier) questions and 24 minutes for the remaining 10 (harder) questions.',
          },
        ],
      },
      {
        id: 'ch4-s4',
        title: 'Grid-In Precision and Common Traps',
        content: [
          'Grid-in questions require you to type your answer rather than select from choices. About 25% of math questions (roughly 11 out of 44) are grid-in format. Precision matters here \u2014 a correct calculation with incorrect entry format gets zero points.',
          'Key grid-in rules: You can enter fractions (like 3/4) or decimals (like 0.75). If a question asks for a fraction, you typically can enter either form. However, make sure not to enter a mixed number incorrectly \u2014 entering "1 1/2" will be read as "11/2" which is wrong. Enter it as 3/2 or 1.5 instead.',
          'Watch for precision requirements. If a question says "to the nearest hundredth," your answer must have exactly two decimal places. If it says "give an exact answer," use fractions to avoid rounding errors.',
          'Common traps: Questions asking for the value of an expression (like 3x) when you solved for x. Make sure you answer what was actually asked, not just the value of the variable. Read the question one final time before entering your grid-in answer.',
        ],
        keyPoints: [
          '~25% of math questions are grid-in (student-produced response)',
          'Avoid mixed numbers \u2014 use improper fractions or decimals',
          'Match precision requirements exactly (nearest tenth, hundredth, etc.)',
          'Answer what was ASKED (e.g., 3x vs x)',
          'Re-read the question before entering your final answer',
        ],
        quiz: [
          {
            id: 'ch4-s4-q1',
            question: 'How should you enter 1\u00BD as a grid-in answer?',
            options: [
              'Type "1 1/2"',
              'Type "1.12"',
              'Type "3/2" or "1.5"',
              'Type "1-1/2"',
            ],
            correctIndex: 2,
            explanation: 'Enter 1\u00BD as 3/2 or 1.5. Typing "1 1/2" would be interpreted as "11/2" which is incorrect.',
          },
          {
            id: 'ch4-s4-q2',
            question: 'A question says "If 2x + 1 = 7, what is the value of 4x?" What common mistake should you avoid?',
            options: [
              'Using a calculator',
              'Entering the value of x (3) instead of 4x (12)',
              'Converting to a decimal',
              'Showing your work',
            ],
            correctIndex: 1,
            explanation: 'A common trap is solving for x (3) but forgetting the question asks for 4x (12). Always re-read what is being asked.',
          },
        ],
      },
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHAPTER 5 — Test Day Preparation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'ch5',
    number: 5,
    title: 'Test Day Preparation',
    description: 'Device setup, what to bring, check-in procedures, and test day tips.',
    icon: '\u{2705}',
    sections: [
      {
        id: 'ch5-s1',
        title: 'Device Setup and Bluebook',
        content: [
          'The digital SAT is taken on your own laptop or tablet using the College Board\'s Bluebook application. You must download and set up Bluebook BEFORE test day \u2014 ideally at least 5 days before your test.',
          'Supported devices include: Windows laptops (Windows 10+), Mac laptops (macOS 11+), iPads (iPadOS 14+), and school-managed Chromebooks. Your device must have a working internet connection to start the test, but the exam itself works offline if the connection drops.',
          'Before test day: Download Bluebook, sign in with your College Board account, and complete the exam setup process. Make sure your device is fully charged and bring your charger as a backup. Test centers may have power outlets available, but do not count on them.',
          'Run the Bluebook app at least once before test day to make sure everything works. Check that your device has enough storage space and that no software updates are pending.',
        ],
        keyPoints: [
          'Download and set up Bluebook at least 5 days before the test',
          'Supported: Windows 10+, macOS 11+, iPad (iPadOS 14+), Chromebooks',
          'Device needs internet to start but works offline during the test',
          'Fully charge your device AND bring your charger',
          'Run Bluebook at least once before test day to verify setup',
        ],
        quiz: [
          {
            id: 'ch5-s1-q1',
            question: 'When should you download and set up the Bluebook application?',
            options: [
              'The morning of the test',
              'The night before the test',
              'At least 5 days before the test',
              'It is already installed on test center computers',
            ],
            correctIndex: 2,
            explanation: 'Download and set up Bluebook at least 5 days before your test to allow time to troubleshoot any issues.',
          },
          {
            id: 'ch5-s1-q2',
            question: 'What happens if the internet drops during the digital SAT?',
            options: [
              'The test is cancelled',
              'You must restart from the beginning',
              'The test continues working offline',
              'You lose all your answers',
            ],
            correctIndex: 2,
            explanation: 'The Bluebook app works offline during the test. You need internet to start, but a connection drop during testing will not affect your exam.',
          },
        ],
      },
      {
        id: 'ch5-s2',
        title: 'What to Bring (and What NOT to Bring)',
        content: [
          'Required items: Your own device with Bluebook installed, a valid photo ID (school ID or government-issued ID), your admission ticket (printed or on your phone), and a charger/power cord for your device.',
          'Recommended items: Extra pencils/pens for scratch work (paper will be provided), a simple watch to track time (no smartwatches), a snack and water for the break, and a backup charger/battery pack.',
          'Prohibited items: Phones and smartwatches must be turned OFF and stored away during testing (having one visible or making noise can result in score cancellation). No separate calculators are allowed \u2014 you will use the on-screen Desmos. No notes, textbooks, or reference materials.',
          'Tip: Keep your phone turned completely off (not just silenced) and in your bag. Even a vibrating phone can be considered a testing irregularity.',
        ],
        keyPoints: [
          'BRING: Device + charger, photo ID, admission ticket',
          'BRING: Pencils for scratch work, snack/water, simple watch',
          'DO NOT BRING: Phones/smartwatches must be OFF and stored away',
          'No separate calculators \u2014 Desmos is provided on-screen',
          'A visible/audible phone can result in score cancellation',
        ],
        quiz: [
          {
            id: 'ch5-s2-q1',
            question: 'What could happen if your phone makes noise during the SAT?',
            options: [
              'Nothing, phones are allowed',
              'You get a warning',
              'Your score could be cancelled',
              'You lose 5 minutes of testing time',
            ],
            correctIndex: 2,
            explanation: 'Having a phone that is visible or makes noise during testing can result in score cancellation. Turn phones completely off and store them away.',
          },
          {
            id: 'ch5-s2-q2',
            question: 'Can you bring your own calculator to the digital SAT?',
            options: [
              'Yes, any calculator is allowed',
              'Yes, but only scientific calculators',
              'No, you must use the on-screen Desmos calculator',
              'Yes, but only graphing calculators',
            ],
            correctIndex: 2,
            explanation: 'Separate calculators are not allowed on the digital SAT. You use the on-screen Desmos graphing calculator provided in the Bluebook app.',
          },
        ],
      },
      {
        id: 'ch5-s3',
        title: 'Test Day Morning and Check-In',
        content: [
          'Arrive at the test center by 7:45 AM. Doors typically open between 7:30 and 8:00 AM, and testing begins at approximately 8:30 AM. Late arrivals may not be admitted, so plan to arrive early.',
          'During check-in: You will show your photo ID and admission ticket, have your device inspected, and be assigned a seat. The proctor will provide scratch paper and give instructions for launching Bluebook.',
          'Test day tips for peak performance: Get 8+ hours of sleep the night before. Eat a balanced breakfast with protein (not just sugar). Stay hydrated but do not over-drink before the test. Use the 10-minute break to stretch, use the restroom, and have your snack.',
          'Mindset matters: Some nervousness is normal and can actually help performance. Take a few deep breaths before starting each module. Remember that you have prepared for this \u2014 trust your practice. If you encounter a difficult question, do not panic; use your strategies (mark and move on, back-solve, use Desmos).',
        ],
        keyPoints: [
          'Arrive by 7:45 AM \u2014 late arrivals may be denied entry',
          'Bring photo ID, admission ticket, device, and charger',
          'Get 8+ hours of sleep and eat a balanced breakfast',
          'Use the 10-minute break to stretch, eat, and recharge',
          'Deep breaths before each module \u2014 trust your preparation',
        ],
        quiz: [
          {
            id: 'ch5-s3-q1',
            question: 'What time should you arrive at the SAT test center?',
            options: ['By 7:00 AM', 'By 7:45 AM', 'By 8:30 AM', 'By 9:00 AM'],
            correctIndex: 1,
            explanation: 'Arrive by 7:45 AM. Doors open between 7:30-8:00 AM and testing starts at approximately 8:30 AM. Late arrivals may not be admitted.',
          },
          {
            id: 'ch5-s3-q2',
            question: 'What should you do during the 10-minute break between sections?',
            options: [
              'Review your answers from Section 1',
              'Study your notes',
              'Stretch, use the restroom, and have a snack',
              'Start preparing for Section 2 on your device',
            ],
            correctIndex: 2,
            explanation: 'Use the break to stretch, use the restroom, and have a snack. You cannot review previous answers or access study materials.',
          },
        ],
      },
    ],
  },
];

// Helper: get all section IDs
export function getAllSectionIds(): string[] {
  return STRATEGY_GUIDE_CHAPTERS.flatMap((ch) => ch.sections.map((s) => s.id));
}

// Helper: get total section count
export function getTotalSectionCount(): number {
  return STRATEGY_GUIDE_CHAPTERS.reduce((sum, ch) => sum + ch.sections.length, 0);
}

// Helper: find a section by ID
export function getSectionById(sectionId: string): { chapter: Chapter; section: Section } | null {
  for (const chapter of STRATEGY_GUIDE_CHAPTERS) {
    for (const section of chapter.sections) {
      if (section.id === sectionId) {
        return { chapter, section };
      }
    }
  }
  return null;
}

// Helper: get the next section after a given one
export function getNextSection(sectionId: string): { chapter: Chapter; section: Section } | null {
  const allSections = STRATEGY_GUIDE_CHAPTERS.flatMap((ch) =>
    ch.sections.map((s) => ({ chapter: ch, section: s })),
  );
  const idx = allSections.findIndex((s) => s.section.id === sectionId);
  if (idx === -1 || idx === allSections.length - 1) return null;
  return allSections[idx + 1];
}
