/**
 * Test Data Seeder
 * Run: node seeder/testDataSeeder.js
 *
 * Creates: 15 test users + quiz responses across all quizzes
 * Covers : leaderboard, analytics, session analytics, weak topics
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

// ─── User definitions ─────────────────────────────────────────────────────────

const TEST_PASSWORD = "Test@1234";

const USER_DEFINITIONS = [
  // Students
  { username: "Aarav Sharma",    email: "aarav.sharma@test.com",    role: "student",  avatar: "AS", tier: "high"   },
  { username: "Priya Nair",      email: "priya.nair@test.com",      role: "student",  avatar: "PN", tier: "high"   },
  { username: "Rohit Verma",     email: "rohit.verma@test.com",     role: "student",  avatar: "RV", tier: "high"   },
  { username: "Sneha Patel",     email: "sneha.patel@test.com",     role: "student",  avatar: "SP", tier: "medium" },
  { username: "Karan Mehta",     email: "karan.mehta@test.com",     role: "student",  avatar: "KM", tier: "medium" },
  { username: "Divya Iyer",      email: "divya.iyer@test.com",      role: "student",  avatar: "DI", tier: "medium" },
  { username: "Arjun Singh",     email: "arjun.singh@test.com",     role: "student",  avatar: "AS", tier: "medium" },
  { username: "Pooja Gupta",     email: "pooja.gupta@test.com",     role: "student",  avatar: "PG", tier: "low"    },
  { username: "Nikhil Joshi",    email: "nikhil.joshi@test.com",    role: "student",  avatar: "NJ", tier: "low"    },
  { username: "Ananya Reddy",    email: "ananya.reddy@test.com",    role: "student",  avatar: "AR", tier: "low"    },
  { username: "Vikram Das",      email: "vikram.das@test.com",      role: "student",  avatar: "VD", tier: "low"    },
  { username: "Meera Krishnan",  email: "meera.krishnan@test.com",  role: "student",  avatar: "MK", tier: "high"   },
  { username: "Aditya Bose",     email: "aditya.bose@test.com",     role: "student",  avatar: "AB", tier: "medium" },
  // Educators
  { username: "Dr. Ramesh Kumar",  email: "ramesh.kumar@test.com",  role: "educator", avatar: "RK", tier: "high"   },
  { username: "Prof. Sunita Rao",  email: "sunita.rao@test.com",    role: "educator", avatar: "SR", tier: "high"   },
];

// Score range by tier
const SCORE_RANGE = {
  high:   { min: 0.75, max: 1.00 },
  medium: { min: 0.45, max: 0.74 },
  low:    { min: 0.10, max: 0.44 },
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scoreForUser(user, totalQuestions) {
  const { min, max } = SCORE_RANGE[user.tier];
  const pct = min + Math.random() * (max - min);
  return Math.round(pct * totalQuestions);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Build fake answers array (we don't need real correctness for seeding)
function buildFakeAnswers(questions) {
  return questions.map((q) => {
    if (q.isMultiSelect) {
      const correctIdx = q.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i >= 0);
      // randomly include or exclude some correct options for variety
      const selected = correctIdx.filter(() => Math.random() > 0.3);
      return { questionId: q._id, selectedOptions: selected.length ? selected : [0] };
    }
    const correctIdx = q.options.findIndex((o) => o.isCorrect);
    // weighted by nothing — the score is set directly on the Response doc
    return {
      questionId: q._id,
      selectedOption: Math.random() > 0.3 ? correctIdx : (correctIdx + 1) % q.options.length,
    };
  });
}

// ─── Main seeder ──────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", process.env.MONGO_URI);

  // ── 1. Fetch existing quizzes (non-deleted, non-session) ──────────────────
  const quizzes = await Quiz.find({ isDeleted: { $ne: true }, expiresAt: { $exists: false } })
    .populate("questions")
    .lean();

  if (!quizzes.length) {
    console.error("No quizzes found. Upload some quizzes first, then run the seeder.");
    process.exit(1);
  }
  console.log(`Found ${quizzes.length} quizzes to seed responses for.`);

  // ── 2. Remove existing test data ──────────────────────────────────────────
  const existingEmails = USER_DEFINITIONS.map((u) => u.email);
  const existingUsers  = await User.find({ email: { $in: existingEmails } });
  const existingIds    = existingUsers.map((u) => u._id);

  if (existingIds.length) {
    await Response.deleteMany({ user: { $in: existingIds } });
    await QuizSession.deleteMany({ userId: { $in: existingIds } });
    await User.deleteMany({ _id: { $in: existingIds } });
    console.log(`Cleaned up ${existingIds.length} existing test users and their data.`);
  }

  // ── 3. Create users ───────────────────────────────────────────────────────
  const hashedPwd  = await bcrypt.hash(TEST_PASSWORD, 10);
  const createdUsers = [];

  for (const def of USER_DEFINITIONS) {
    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(def.username)}&background=7c3aed&color=fff&size=128&bold=true`;
    const user = await new User({
      username: def.username,
      email:    def.email,
      password: hashedPwd,
      role:     def.role,
      photoURL,
      quizzesTaken: [],
    }).save();
    createdUsers.push({ ...def, _id: user._id });
  }
  console.log(`Created ${createdUsers.length} test users.`);

  // ── 4. Create responses (quiz attempts) ───────────────────────────────────
  const students = createdUsers.filter((u) => u.role === "student");
  let totalResponses = 0;

  for (const student of students) {
    // Each student attempts a random subset of quizzes (60–100%)
    const quizSubset = quizzes
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(1, Math.floor(quizzes.length * (0.6 + Math.random() * 0.4))));

    const takenIds = [];

    for (const quiz of quizSubset) {
      const questions = quiz.questions;
      if (!questions?.length) continue;

      const attemptsCount = rand(1, 3); // 1–3 attempts per quiz
      const quizAdded     = false;

      for (let attempt = 0; attempt < attemptsCount; attempt++) {
        const score   = scoreForUser(student, questions.length);
        const answers = buildFakeAnswers(questions);

        // Spread attempts over the last 30 days with recent ones in last 7 days
        const daysBack = attempt === 0
          ? rand(8, 30)   // older attempt
          : rand(0, 7);   // recent attempt (shows up in weekly leaderboard)
        const createdAt = daysAgo(daysBack);

        await Response.create({
          user:      student._id,
          quiz:      quiz._id,
          answers,
          score,
          createdAt,
        });
        totalResponses++;
      }

      takenIds.push(quiz._id);
    }

    await User.findByIdAndUpdate(student._id, { quizzesTaken: takenIds });
  }

  console.log(`Created ${totalResponses} quiz responses.`);

  // ── 5. Create a few in-progress quiz sessions (for session analytics) ─────
  let sessionCount = 0;
  for (const student of students.slice(0, 5)) {
    const quiz = quizzes[rand(0, quizzes.length - 1)];
    if (!quiz.questions?.length) continue;

    const partialAnswers = quiz.questions.slice(0, rand(1, 3)).map((q) => ({
      questionId:     q._id,
      selectedOption: rand(0, q.options.length - 1),
      savedAt:        new Date(),
    }));

    await QuizSession.create({
      userId:       student._id,
      quizId:       quiz._id,
      status:       "in_progress",
      answers:      partialAnswers,
      currentIndex: partialAnswers.length,
      startedAt:    daysAgo(rand(0, 2)),
      lastActiveAt: daysAgo(rand(0, 1)),
    });
    sessionCount++;
  }
  console.log(`Created ${sessionCount} in-progress sessions.`);

  // ── 6. Write user credentials to CSV ─────────────────────────────────────
  const csvLines = [
    "Name,Email,Password,Role,Tier",
    ...USER_DEFINITIONS.map(
      (u) => `"${u.username}",${u.email},${TEST_PASSWORD},${u.role},${u.tier || "-"}`
    ),
    "",
    `"Admin (existing)","admin@quizshazam.com","QuizShazam@2026","admin","-"`,
  ];

  const csvPath = path.join(__dirname, "test_users.csv");
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");
  console.log(`\nUser credentials saved → ${csvPath}`);

  // ── 7. Print summary table ────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  TEST USERS CREATED");
  console.log("═══════════════════════════════════════════════════════");
  console.log(
    ["Name", "Email", "Role", "Tier"].map((h) => h.padEnd(22)).join("")
  );
  console.log("─".repeat(90));
  for (const u of USER_DEFINITIONS) {
    console.log(
      [u.username, u.email, u.role, u.tier || "-"].map((v) => String(v).padEnd(22)).join("")
    );
  }
  console.log("─".repeat(90));
  console.log(`  Password for all users: ${TEST_PASSWORD}`);
  console.log(`  Admin: admin@quizshazam.com / QuizShazam@2026`);
  console.log("═══════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Done. Disconnected from MongoDB.");
}

seed().catch((err) => {
  console.error("Seeder failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
