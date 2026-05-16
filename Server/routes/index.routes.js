var express = require("express");
var router = express.Router();
var Quiz = require("../model/quiz");
var Question = require("../model/question");
var userModel = require("../model/user");
var Authentication = require("../middleware/auth");
const { getAllusers, getById, sendResetLink, resetPassword, getUserStats, createSession, getAllsession, getSessionById, getSessionResults, extendSession, getAllQuizzes, shareQuiz, updateQuestion, updateQuiz, getFailedQuestions, getWeakTopics, getUserPerformanceSummary, getSettings, updateSettings, getSessionAnalytics, getGlobalLeaderboard, getWeeklyLeaderboard, getQuizLeaderboard, getSubjectLeaderboard, getLeaderboardSubjects, getCertificate, getDailyChallenge } = require("../controller/index.controller");
const { getPublicProfile } = require("../controller/user.controller");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/create-quiz", Authentication, async (req, res) => {
  const array = req.body;
  try {
    const quizzes = await Promise.all(
      array.map(async ({ title, description, questions, authorId, timerMinutes, allowPreviousQuestion, passingPercentage }) => {
        const subjectName = title;

        let quizTitle = title;
        // Auto-generate a descriptive title only when the provided title matches the subject (no custom title set)
        // The frontend sends title=subject when no custom title is provided
        // We detect this by checking if the title contains " — " already (custom) or not
        if (title && !title.includes(" — ")) {
          const existingCount = await Quiz.countDocuments({ subject: subjectName, isDeleted: { $ne: true } });
          const TITLE_TIERS = [
            "Fundamentals",
            "Core Concepts",
            "Intermediate Challenge",
            "Advanced Concepts",
            "Expert Level",
            "Mastery Quiz",
            "Deep Dive",
            "Practice Series",
            "Comprehensive Review",
            "Ultimate Challenge",
          ];
          const tierLabel = TITLE_TIERS[existingCount % TITLE_TIERS.length];
          quizTitle = `${subjectName} — ${tierLabel}`;
        }

        const quiz = new Quiz({
          title: quizTitle,
          subject: subjectName,
          description,
          author: authorId,
          timerMinutes: timerMinutes ? parseInt(timerMinutes) : 5,
          allowPreviousQuestion: allowPreviousQuestion === true || allowPreviousQuestion === "true",
          passingPercentage: passingPercentage ? parseInt(passingPercentage) : 70,
        });
        await quiz.save();

        await Promise.all(
          questions
            .filter((q) => {
              return q.questionText != undefined;
            })
            .map(async (q) => {
              const question = new Question({
                questionText: q.questionText,
                options: q.options,
                quiz: quiz._id,
                explanation: q.explanation || null,
                referenceLink: q.referenceLink || null,
                topic: q.topic || null,
                difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "easy",
                isMultiSelect: q.questionType === "multi" || !!q.isMultiSelect,
                questionType: ["mcq", "multi", "true_false"].includes(q.questionType) ? q.questionType : (q.isMultiSelect ? "multi" : "mcq"),
                // timerSeconds: q.timerSeconds != null ? parseInt(q.timerSeconds) || null : null, // deprecated: use quiz-level timerMinutes
                marks: q.marks && q.marks >= 1 ? parseInt(q.marks) : 1,
              });
              await question.save();
              quiz.questions.push(question);
            })
        );

        await quiz.save();
        return quiz;
      })
    );

    res.status(201).send({ success: true, message: "Quiz created successfully", quizzes });
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
    res.status(500).send({ message: "Error creating quiz", error });
  }
});

// Get all quizzes
router.get("/quizzes", Authentication, getAllQuizzes);

router.get("/getAllQuizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isDeleted: { $ne: true } });
    res.status(200).send(quizzes);
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error)
    res.status(500).send({ message: "Error retrieving quizzes", error });
  }
});

router.get("/protected", Authentication, async (req, res) => {
  try {
    // Use the user ID from the request object (set by the middleware)
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all users
router.get("/users", getAllusers);

// Get quiz by ID
router.get("/quiz/:id", getById);


router.post("/mail-password", Authentication, sendResetLink);

router.post("/reset-password", Authentication, resetPassword)

router.get("/All-Stats", getUserStats);

router.post("/share-quiz",Authentication,shareQuiz)

router.post("/create-assessment", createSession)

router.get("/getAllsession", getAllsession)
router.get("/session/:id", getSessionById)
router.get("/session/:id/results", Authentication, getSessionResults)
router.patch("/session/:id/extend", Authentication, extendSession)

router.put("/question/:id", Authentication, updateQuestion)
router.patch("/quiz/:id", Authentication, updateQuiz)
router.get("/analytics/sessions", Authentication, getSessionAnalytics)
router.get("/analytics/failed-questions", Authentication, getFailedQuestions)
router.get("/analytics/weak-topics", Authentication, getWeakTopics)
router.get("/analytics/user-performance", Authentication, getUserPerformanceSummary)

// Settings
router.get("/settings", getSettings)
router.put("/settings", Authentication, updateSettings)

// Certificate (public — accessible via QR code scan)
router.get("/certificate/:id", getCertificate)

// Daily challenge (public, optional auth for completion status)
router.get("/daily-challenge", getDailyChallenge)

// Public user profile
router.get("/u/:username", getPublicProfile)

// Leaderboards (public)
router.get("/leaderboard/global", getGlobalLeaderboard)
router.get("/leaderboard/weekly", getWeeklyLeaderboard)
router.get("/leaderboard/quiz/:quizId", getQuizLeaderboard)
router.get("/leaderboard/subject/:subject", getSubjectLeaderboard)
router.get("/leaderboard/subjects", getLeaderboardSubjects)


router.delete("/quiz/:id", Authentication, async (req, res) => {
  const { id } = req.params;
  try {
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).send({ message: "Quiz not found" });
    quiz.isDeleted = true;
    quiz.deletedAt = new Date();
    await quiz.save();
    res.status(200).send({ message: "Quiz archived successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error archiving quiz", error });
  }
});

router.patch("/quiz/:id/restore", Authentication, async (req, res) => {
  const { id } = req.params;
  try {
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).send({ message: "Quiz not found" });
    quiz.isDeleted = false;
    quiz.deletedAt = null;
    await quiz.save();
    res.status(200).send({ message: "Quiz restored successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error restoring quiz", error });
  }
});

module.exports = router;
