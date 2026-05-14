/**
 * Test Data Seeder
 * Run: npm run seed:test
 *
 * Creates: quizzes + questions + 15 users + responses + sessions
 * Covers : leaderboard (global/weekly/subject), analytics, weak topics
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const fs       = require("fs");
const path     = require("path");

const User        = require("../model/user");
const Quiz        = require("../model/quiz");
const Question    = require("../model/question");
const Response    = require("../model/response");
const QuizSession = require("../model/quizSession");

// ─── Quiz seed data ───────────────────────────────────────────────────────────

const QUIZ_SEED = [
  {
    subject: "JavaScript",
    quizzes: [
      {
        title: "Test 1",
        description: "JavaScript fundamentals",
        questions: [
          { text: "What is the output of typeof null?", options: ["null","object","undefined","string"], correct: 1, topic: "Types", difficulty: "easy" },
          { text: "Which method removes the last element of an array?", options: ["shift()","pop()","splice()","slice()"], correct: 1, topic: "Arrays", difficulty: "easy" },
          { text: "What does === check?", options: ["Value only","Type only","Value and type","Reference"], correct: 2, topic: "Operators", difficulty: "easy" },
          { text: "What is a closure in JavaScript?", options: ["A loop construct","A function with access to its outer scope","A type of variable","An error handler"], correct: 1, topic: "Closures", difficulty: "medium" },
          { text: "Which keyword declares a block-scoped variable?", options: ["var","function","let","global"], correct: 2, topic: "Variables", difficulty: "easy" },
        ],
      },
      {
        title: "Test 2",
        description: "JavaScript advanced",
        questions: [
          { text: "What does Promise.all() do?", options: ["Runs promises one by one","Resolves when all promises resolve","Rejects on first failure only","None of the above"], correct: 1, topic: "Promises", difficulty: "medium" },
          { text: "What is event delegation?", options: ["Handling events on parent elements","Creating new events","Removing event listeners","Blocking default events"], correct: 0, topic: "DOM", difficulty: "medium" },
          { text: "What is the difference between call and apply?", options: ["No difference","call takes array args","apply takes array args","apply is synchronous"], correct: 2, topic: "Functions", difficulty: "hard" },
          { text: "What does the spread operator do?", options: ["Copies an array/object","Deletes properties","Creates a class","Imports modules"], correct: 0, topic: "ES6", difficulty: "easy" },
          { text: "What is debouncing?", options: ["Slowing down loops","Delaying function execution until after a wait","Caching API responses","A CSS technique"], correct: 1, topic: "Performance", difficulty: "medium" },
        ],
      },
    ],
  },
  {
    subject: "React",
    quizzes: [
      {
        title: "Test 1",
        description: "React core concepts",
        questions: [
          { text: "What hook is used for side effects?", options: ["useState","useEffect","useRef","useContext"], correct: 1, topic: "Hooks", difficulty: "easy" },
          { text: "What does useMemo do?", options: ["Stores a memoized value","Fetches data","Creates a ref","Triggers a re-render"], correct: 0, topic: "Hooks", difficulty: "medium" },
          { text: "What is the virtual DOM?", options: ["A browser API","A lightweight JS representation of the real DOM","A database","A CSS framework"], correct: 1, topic: "Core", difficulty: "easy" },
          { text: "How do you pass data from parent to child?", options: ["State","Context","Props","Refs"], correct: 2, topic: "Props", difficulty: "easy" },
          { text: "What is React.memo used for?", options: ["Memoizing expensive calculations","Preventing unnecessary re-renders","Caching API calls","Managing state"], correct: 1, topic: "Performance", difficulty: "medium" },
        ],
      },
      {
        title: "Test 2",
        description: "React state and patterns",
        questions: [
          { text: "What is the Context API used for?", options: ["Routing","Global state sharing","Styling","HTTP requests"], correct: 1, topic: "Context", difficulty: "medium" },
          { text: "What does useCallback return?", options: ["A memoized value","A memoized function","A DOM reference","A promise"], correct: 1, topic: "Hooks", difficulty: "medium" },
          { text: "What is prop drilling?", options: ["Passing props through many component layers","A CSS technique","A testing method","A build process"], correct: 0, topic: "Patterns", difficulty: "easy" },
          { text: "Which lifecycle method runs after every render?", options: ["componentDidMount","componentWillUnmount","componentDidUpdate","getDerivedStateFromProps"], correct: 2, topic: "Lifecycle", difficulty: "medium" },
          { text: "What does the key prop do in lists?", options: ["Styles the element","Helps React identify which items changed","Sets the index","Creates a unique ID"], correct: 1, topic: "Core", difficulty: "easy" },
        ],
      },
    ],
  },
  {
    subject: "Node.js",
    quizzes: [
      {
        title: "Test 1",
        description: "Node.js fundamentals",
        questions: [
          { text: "What is the event loop in Node.js?", options: ["A for loop","A mechanism to handle async operations","A database loop","A CSS animation"], correct: 1, topic: "Event Loop", difficulty: "medium" },
          { text: "What does require() do?", options: ["Makes an HTTP request","Imports a module","Creates a variable","Runs a script"], correct: 1, topic: "Modules", difficulty: "easy" },
          { text: "Which module handles file operations?", options: ["http","path","fs","os"], correct: 2, topic: "Core Modules", difficulty: "easy" },
          { text: "What is middleware in Express?", options: ["A database","A function that runs between request and response","A templating engine","A routing library"], correct: 1, topic: "Express", difficulty: "easy" },
          { text: "What does process.env contain?", options: ["Running processes","Environment variables","File paths","CPU info"], correct: 1, topic: "Process", difficulty: "easy" },
        ],
      },
    ],
  },
  {
    subject: "MongoDB",
    quizzes: [
      {
        title: "Test 1",
        description: "MongoDB and Mongoose",
        questions: [
          { text: "What is a MongoDB document?", options: ["A table row","A JSON-like record","A SQL query","A schema"], correct: 1, topic: "Core", difficulty: "easy" },
          { text: "What does $gt mean in a query?", options: ["Greater than","Less than","Equals","Not equal"], correct: 0, topic: "Queries", difficulty: "easy" },
          { text: "What is an index in MongoDB?", options: ["A primary key","A data structure for fast lookups","A foreign key","A trigger"], correct: 1, topic: "Indexes", difficulty: "medium" },
          { text: "What does populate() do in Mongoose?", options: ["Creates a document","Replaces ObjectId refs with actual data","Validates a schema","Deletes a field"], correct: 1, topic: "Mongoose", difficulty: "medium" },
          { text: "What is an aggregation pipeline?", options: ["A type of index","A series of data transformation stages","A backup method","A connection pool"], correct: 1, topic: "Aggregation", difficulty: "hard" },
        ],
      },
    ],
  },
  {
    subject: "DSA",
    quizzes: [
      {
        title: "Test 1",
        description: "Data Structures & Algorithms",
        questions: [
          { text: "What is the time complexity of binary search?", options: ["O(n)","O(n²)","O(log n)","O(1)"], correct: 2, topic: "Searching", difficulty: "medium" },
          { text: "Which data structure uses LIFO order?", options: ["Queue","Stack","Linked List","Heap"], correct: 1, topic: "Stacks", difficulty: "easy" },
          { text: "What is the worst case of quicksort?", options: ["O(n log n)","O(n)","O(n²)","O(log n)"], correct: 2, topic: "Sorting", difficulty: "hard" },
          { text: "What is a hash collision?", options: ["Two keys map to the same hash","A key not found","A deleted entry","An overflow"], correct: 0, topic: "Hashing", difficulty: "medium" },
          { text: "Which traversal visits left, root, right?", options: ["Preorder","Postorder","Inorder","BFS"], correct: 2, topic: "Trees", difficulty: "easy" },
        ],
      },
    ],
  },
];

// ─── User definitions ─────────────────────────────────────────────────────────

const TEST_PASSWORD = "Test@1234";

const USER_DEFINITIONS = [
  { username: "Aarav Sharma",    email: "aarav.sharma@test.com",    role: "student",  tier: "high"   },
  { username: "Priya Nair",      email: "priya.nair@test.com",      role: "student",  tier: "high"   },
  { username: "Rohit Verma",     email: "rohit.verma@test.com",     role: "student",  tier: "high"   },
  { username: "Sneha Patel",     email: "sneha.patel@test.com",     role: "student",  tier: "medium" },
  { username: "Karan Mehta",     email: "karan.mehta@test.com",     role: "student",  tier: "medium" },
  { username: "Divya Iyer",      email: "divya.iyer@test.com",      role: "student",  tier: "medium" },
  { username: "Arjun Singh",     email: "arjun.singh@test.com",     role: "student",  tier: "medium" },
  { username: "Pooja Gupta",     email: "pooja.gupta@test.com",     role: "student",  tier: "low"    },
  { username: "Nikhil Joshi",    email: "nikhil.joshi@test.com",    role: "student",  tier: "low"    },
  { username: "Ananya Reddy",    email: "ananya.reddy@test.com",    role: "student",  tier: "low"    },
  { username: "Vikram Das",      email: "vikram.das@test.com",      role: "student",  tier: "low"    },
  { username: "Meera Krishnan",  email: "meera.krishnan@test.com",  role: "student",  tier: "high"   },
  { username: "Aditya Bose",     email: "aditya.bose@test.com",     role: "student",  tier: "medium" },
  { username: "Dr. Ramesh Kumar", email: "ramesh.kumar@test.com",   role: "educator", tier: "high"   },
  { username: "Prof. Sunita Rao", email: "sunita.rao@test.com",     role: "educator", tier: "high"   },
];

const SCORE_RANGE = {
  high:   { min: 0.75, max: 1.00 },
  medium: { min: 0.45, max: 0.74 },
  low:    { min: 0.10, max: 0.44 },
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scoreForUser(user, total) {
  const { min, max } = SCORE_RANGE[user.tier ?? "medium"];
  return Math.round((min + Math.random() * (max - min)) * total);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function buildAnswers(questions, targetScore) {
  let scored = 0;
  return questions.map((q) => {
    const correctIdx = q.options.findIndex((o) => o.isCorrect);
    const giveCorrect = scored < targetScore && Math.random() > 0.2;
    if (giveCorrect) scored++;
    return {
      questionId:     q._id,
      selectedOption: giveCorrect ? correctIdx : (correctIdx + 1) % q.options.length,
      selectedOptions: [],
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected:", process.env.MONGO_URI);

  // ── Step 1: clean previous test data ──────────────────────────────────────
  const existingEmails = USER_DEFINITIONS.map((u) => u.email);
  const oldUsers = await User.find({ email: { $in: existingEmails } });
  const oldIds   = oldUsers.map((u) => u._id);
  if (oldIds.length) {
    await Response.deleteMany({ user: { $in: oldIds } });
    await QuizSession.deleteMany({ userId: { $in: oldIds } });
    await User.deleteMany({ _id: { $in: oldIds } });
  }

  // Remove seed quizzes from previous run
  const seedSubjects = QUIZ_SEED.map((s) => s.subject);
  const oldQuizzes = await Quiz.find({ subject: { $in: seedSubjects }, author: "seed" });
  const oldQuizIds = oldQuizzes.map((q) => q._id);
  if (oldQuizIds.length) {
    await Question.deleteMany({ quiz: { $in: oldQuizIds } });
    await Quiz.deleteMany({ _id: { $in: oldQuizIds } });
  }
  console.log("✓ Cleaned previous seed data");

  // ── Step 2: create quizzes + questions ────────────────────────────────────
  const allQuizzes = [];
  for (const subjectData of QUIZ_SEED) {
    for (const quizDef of subjectData.quizzes) {
      const quiz = await new Quiz({
        title:       quizDef.title,
        subject:     subjectData.subject,
        description: quizDef.description,
        author:      "seed",
        questions:   [],
      }).save();

      for (const qDef of quizDef.questions) {
        const opts = qDef.options.map((text, i) => ({ text, isCorrect: i === qDef.correct }));
        const q = await new Question({
          questionText: qDef.text,
          options:      opts,
          quiz:         quiz._id,
          topic:        qDef.topic,
          difficulty:   qDef.difficulty,
          isMultiSelect: false,
          questionType: "mcq",
        }).save();
        quiz.questions.push(q._id);
      }
      await quiz.save();

      // re-fetch with populated questions for response generation
      const populated = await Quiz.findById(quiz._id).populate("questions").lean();
      allQuizzes.push(populated);
    }
  }
  console.log(`✓ Created ${allQuizzes.length} quizzes with questions`);

  // ── Step 3: create users ──────────────────────────────────────────────────
  const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
  const users  = [];
  for (const def of USER_DEFINITIONS) {
    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(def.username)}&background=7c3aed&color=fff&size=128&bold=true`;
    const user = await new User({
      username: def.username,
      email:    def.email,
      password: hashed,
      role:     def.role,
      photoURL,
      quizzesTaken: [],
    }).save();
    users.push({ ...def, _id: user._id });
  }
  console.log(`✓ Created ${users.length} users`);

  // ── Step 4: create responses ──────────────────────────────────────────────
  const students = users.filter((u) => u.role === "student");
  let totalResponses = 0;

  for (const student of students) {
    const takenIds = [];
    // Each student does 70-100% of quizzes
    const subset = [...allQuizzes]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(3, Math.floor(allQuizzes.length * (0.7 + Math.random() * 0.3))));

    for (const quiz of subset) {
      takenIds.push(quiz._id);
      const attempts = rand(1, 3);
      for (let a = 0; a < attempts; a++) {
        const score   = scoreForUser(student, quiz.questions.length);
        const answers = buildAnswers(quiz.questions, score);
        // spread across last 30 days; latest attempt always in last 7 (weekly board)
        const daysBack = a === attempts - 1 ? rand(0, 6) : rand(7, 30);
        await Response.create({
          user:      student._id,
          quiz:      quiz._id,
          answers,
          score,
          createdAt: daysAgo(daysBack),
        });
        totalResponses++;
      }
    }
    await User.findByIdAndUpdate(student._id, { quizzesTaken: takenIds });
  }
  console.log(`✓ Created ${totalResponses} quiz responses`);

  // ── Step 5: create in-progress sessions ──────────────────────────────────
  for (const student of students.slice(0, 6)) {
    const quiz = allQuizzes[rand(0, allQuizzes.length - 1)];
    const partial = quiz.questions.slice(0, rand(1, 3)).map((q) => ({
      questionId:     q._id,
      selectedOption: rand(0, q.options.length - 1),
      savedAt:        new Date(),
    }));
    try {
      await QuizSession.create({
        userId:       student._id,
        quizId:       quiz._id,
        status:       "in_progress",
        answers:      partial,
        currentIndex: partial.length,
        startedAt:    daysAgo(rand(0, 2)),
        lastActiveAt: daysAgo(0),
      });
    } catch {} // skip if duplicate
  }
  console.log("✓ Created in-progress sessions");

  // ── Step 6: write CSV ─────────────────────────────────────────────────────
  const rows = [
    ["Name", "Email", "Password", "Role", "Score Tier"],
    ...USER_DEFINITIONS.map((u) => [u.username, u.email, TEST_PASSWORD, u.role, u.tier ?? "-"]),
    ["", "", "", "", ""],
    ["Admin (existing)", "admin@quizshazam.com", "QuizShazam@2026", "admin", "-"],
  ];
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const csvPath = path.join(__dirname, "test_users.csv");
  fs.writeFileSync(csvPath, csv, "utf8");

  // ── Step 7: print table ───────────────────────────────────────────────────
  const line = "─".repeat(88);
  console.log("\n" + "═".repeat(88));
  console.log("  TEST USERS");
  console.log("═".repeat(88));
  console.log(["Name".padEnd(24), "Email".padEnd(32), "Role".padEnd(12), "Tier"].join(""));
  console.log(line);
  for (const u of USER_DEFINITIONS) {
    console.log([
      u.username.padEnd(24),
      u.email.padEnd(32),
      u.role.padEnd(12),
      u.tier ?? "-",
    ].join(""));
  }
  console.log(line);
  console.log(`  Password for all:  ${TEST_PASSWORD}`);
  console.log(`  Admin:             admin@quizshazam.com  /  QuizShazam@2026`);
  console.log("═".repeat(88));
  console.log(`\n  CSV saved → ${csvPath}\n`);

  await mongoose.disconnect();
  console.log("✓ Done. Disconnected.\n");
}

seed().catch((err) => {
  console.error("Seeder failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
