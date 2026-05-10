/**
 * Analytics Demo Seeder
 * Run: node seeder/analyticsSeeder.js
 *
 * Creates:
 *  - 1 quiz "JavaScript Fundamentals" with 8 questions (topics + difficulty set)
 *  - 6 fake student users
 *  - 1 response per user with realistic wrong answers
 *
 * After running, go to http://localhost:3001/stats to see the analytics.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../model/user");
const Quiz = require("../model/quiz");
const Question = require("../model/question");
const Response = require("../model/response");

const QUIZ_TITLE = "JavaScript Fundamentals";

// ── Questions ──────────────────────────────────────────────────────────────────
// correctIndex = 0-based index of the correct option in the options array
const QUESTIONS = [
  {
    questionText: 'What does "typeof null" return in JavaScript?',
    options: [
      { text: "object",    isCorrect: true  },
      { text: "null",      isCorrect: false },
      { text: "undefined", isCorrect: false },
      { text: "boolean",   isCorrect: false },
    ],
    explanation: 'typeof null returns "object" — a historic bug in JavaScript that was never fixed for backward compatibility.',
    referenceLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof",
    topic: "JavaScript Basics",
    difficulty: "easy",
    // Students who will answer WRONG (0-based user index)
    wrongUsers: [1, 2, 3, 4, 5],   // 5 of 6 wrong → 83% failure
  },
  {
    questionText: "What is the output of: console.log(0.1 + 0.2 === 0.3)?",
    options: [
      { text: "true",      isCorrect: false },
      { text: "false",     isCorrect: true  },
      { text: "undefined", isCorrect: false },
      { text: "NaN",       isCorrect: false },
    ],
    explanation: "Due to floating-point precision, 0.1 + 0.2 = 0.30000000000000004, not exactly 0.3.",
    referenceLink: "https://floating-point-gui.de/",
    topic: "JavaScript Basics",
    difficulty: "medium",
    wrongUsers: [0, 2, 3, 4],   // 4 of 6 wrong → 67%
  },
  {
    questionText: "What is a closure in JavaScript?",
    options: [
      { text: "A loop construct",                             isCorrect: false },
      { text: "A function with access to its outer scope",    isCorrect: true  },
      { text: "A built-in method",                            isCorrect: false },
      { text: "A type of error",                              isCorrect: false },
    ],
    explanation: "A closure is a function that retains access to variables from its parent scope even after the parent has finished executing.",
    referenceLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
    topic: "Functions & Scope",
    difficulty: "medium",
    wrongUsers: [0, 1, 3, 5],   // 4 of 6 → 67%
  },
  {
    questionText: "Which method adds an element to the END of an array?",
    options: [
      { text: "push()",    isCorrect: true  },
      { text: "pop()",     isCorrect: false },
      { text: "shift()",   isCorrect: false },
      { text: "unshift()", isCorrect: false },
    ],
    explanation: "push() appends one or more elements to the end and returns the new length.",
    referenceLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push",
    topic: "Arrays",
    difficulty: "easy",
    wrongUsers: [3],   // only 1 of 6 wrong → 17% (won't appear in failed list)
  },
  {
    questionText: "What does the event loop do in JavaScript?",
    options: [
      { text: "Handles synchronous code",         isCorrect: false },
      { text: "Manages async callbacks",           isCorrect: true  },
      { text: "Compiles JavaScript",               isCorrect: false },
      { text: "Garbage collects memory",           isCorrect: false },
    ],
    explanation: "The event loop continuously checks the call stack and callback queue, pushing queued callbacks onto the stack when it is empty.",
    referenceLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop",
    topic: "Async JavaScript",
    difficulty: "hard",
    wrongUsers: [0, 1, 2, 3, 4],   // 5 of 6 → 83% failure ← will appear
  },
  {
    questionText: 'What does "use strict" do?',
    options: [
      { text: "Enables ES6 features",          isCorrect: false },
      { text: "Disables var keyword",           isCorrect: false },
      { text: "Enforces stricter parsing rules",isCorrect: true  },
      { text: "Makes code run faster",          isCorrect: false },
    ],
    // No explanation — analytics will flag this for missing explanation
    explanation: null,
    referenceLink: null,
    topic: "JavaScript Basics",
    difficulty: "easy",
    wrongUsers: [1, 2, 4, 5],   // 4 of 6 → 67%
  },
  {
    questionText: "What is event bubbling?",
    options: [
      { text: "Events fire from child to parent", isCorrect: true  },
      { text: "Events fire from parent to child", isCorrect: false },
      { text: "Events cancel each other",         isCorrect: false },
      { text: "A memory leak pattern",            isCorrect: false },
    ],
    explanation: "When an event fires on a child element it bubbles up through all ancestors unless stopped with stopPropagation().",
    referenceLink: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events",
    topic: "DOM & Events",
    difficulty: "hard",
    wrongUsers: [0, 1, 2, 3, 4, 5],  // all 6 wrong → 100% failure ← most critical
  },
  {
    questionText: "Which operator checks value AND type in JavaScript?",
    options: [
      { text: "==",  isCorrect: false },
      { text: "===", isCorrect: true  },
      { text: "=",   isCorrect: false },
      { text: "!==", isCorrect: false },
    ],
    explanation: "=== is the strict equality operator. It checks both value and type without coercion. Always prefer it over ==.",
    referenceLink: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality",
    topic: "Operators",
    difficulty: "easy",
    wrongUsers: [2, 5],   // 2 of 6 → 33% (won't appear)
  },
];

// ── Fake students ──────────────────────────────────────────────────────────────
const STUDENTS = [
  { username: "Arjun Sharma",  email: "arjun@demo.com"  },
  { username: "Priya Patel",   email: "priya@demo.com"  },
  { username: "Rahul Verma",   email: "rahul@demo.com"  },
  { username: "Sneha Gupta",   email: "sneha@demo.com"  },
  { username: "Karan Singh",   email: "karan@demo.com"  },
  { username: "Meera Joshi",   email: "meera@demo.com"  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const wrongOptionIndex = (options, correctIndex) => {
  // pick the first wrong option (not the correct one)
  for (let i = 0; i < options.length; i++) {
    if (i !== correctIndex) return i;
  }
  return 0;
};

// ── Main ───────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // ── 1. Clean up previous seed data ──────────────────────────────────────────
  const existingQuiz = await Quiz.findOne({ title: QUIZ_TITLE });
  if (existingQuiz) {
    await Question.deleteMany({ quiz: existingQuiz._id });
    await Response.deleteMany({ quiz: existingQuiz._id });
    await Quiz.findByIdAndDelete(existingQuiz._id);
    console.log("Removed previous seed quiz");
  }

  const existingEmails = STUDENTS.map((s) => s.email);
  await User.deleteMany({ email: { $in: existingEmails } });
  console.log("Removed previous seed users");

  // ── 2. Create quiz ───────────────────────────────────────────────────────────
  const quiz = new Quiz({ title: QUIZ_TITLE, description: "Core JS concepts quiz for analytics demo" });
  await quiz.save();
  console.log(`Created quiz: "${QUIZ_TITLE}"`);

  // ── 3. Create questions ──────────────────────────────────────────────────────
  const savedQuestions = [];
  for (const q of QUESTIONS) {
    const question = new Question({
      questionText: q.questionText,
      options: q.options,
      quiz: quiz._id,
      explanation: q.explanation ?? null,
      referenceLink: q.referenceLink ?? null,
      topic: q.topic,
      difficulty: q.difficulty,
    });
    await question.save();
    quiz.questions.push(question._id);
    savedQuestions.push({ ...q, _id: question._id });
  }
  await quiz.save();
  console.log(`Created ${savedQuestions.length} questions`);

  // ── 4. Create students ───────────────────────────────────────────────────────
  const password = await bcrypt.hash("demo1234", 10);
  const savedUsers = [];
  for (const s of STUDENTS) {
    const user = new User({ ...s, password, photoURL: "" });
    await user.save();
    savedUsers.push(user);
  }
  console.log(`Created ${savedUsers.length} demo students`);

  // ── 5. Create responses ──────────────────────────────────────────────────────
  for (let ui = 0; ui < savedUsers.length; ui++) {
    const user = savedUsers[ui];
    let score = 0;
    const answers = [];

    for (const q of savedQuestions) {
      const isWrong = q.wrongUsers.includes(ui);
      const correctIdx = q.options.findIndex((o) => o.isCorrect);
      const selectedOption = isWrong ? wrongOptionIndex(q.options, correctIdx) : correctIdx;

      if (!isWrong) score += 1;
      answers.push({ questionId: q._id, selectedOption });
    }

    const response = new Response({ user: user._id, quiz: quiz._id, answers, score });
    await response.save();

    await User.findByIdAndUpdate(user._id, { $push: { quizzesTaken: quiz._id } });
    console.log(`  ${user.username}: score ${score}/${savedQuestions.length}`);
  }

  // ── 6. Print summary ─────────────────────────────────────────────────────────
  console.log("\n── Expected Analytics Results ─────────────────────────");
  for (const q of QUESTIONS) {
    const pct = Math.round((q.wrongUsers.length / STUDENTS.length) * 100);
    const flag = pct >= 70 ? "⚠️  WILL APPEAR" : "✓  ok";
    const exp = q.explanation ? "has explanation" : "❌ NO EXPLANATION";
    console.log(`  ${pct}% failure | ${flag} | ${exp} | ${q.topic}`);
    console.log(`           "${q.questionText.slice(0, 60)}…"`);
  }
  console.log("\n── Topic Accuracy ─────────────────────────────────────");
  const topicMap = {};
  for (const q of QUESTIONS) {
    if (!topicMap[q.topic]) topicMap[q.topic] = { total: 0, wrong: 0 };
    topicMap[q.topic].total += STUDENTS.length;
    topicMap[q.topic].wrong += q.wrongUsers.length;
  }
  for (const [topic, { total, wrong }] of Object.entries(topicMap)) {
    const acc = Math.round(((total - wrong) / total) * 100);
    console.log(`  ${acc}% accuracy | ${topic}`);
  }

  console.log("\n✅ Seed complete. Open http://localhost:3001/stats");
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
