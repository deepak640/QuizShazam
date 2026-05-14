var express = require("express");
var router = express.Router();
var Quiz = require("../model/quiz");
var Question = require("../model/question");
var userModel = require("../model/user");
var Authentication = require("../middleware/auth");
const { getAllusers, getById, sendResetLink, resetPassword, getUserStats, createSession, getAllsession, getSessionById, getSessionResults, extendSession, getAllQuizzes, shareQuiz, updateQuestion, getFailedQuestions, getWeakTopics, getUserPerformanceSummary, getSettings, updateSettings, getSessionAnalytics, getGlobalLeaderboard, getWeeklyLeaderboard, getQuizLeaderboard, getSubjectLeaderboard, getLeaderboardSubjects, getCertificate } = require("../controller/index.controller");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/create-quiz", Authentication, async (req, res) => {
  const array = req.body;
  try {
    const quizzes = await Promise.all(
      array.map(async ({ title, description, questions, authorId }) => {
        const subjectName = title;
        const existingCount = await Quiz.countDocuments({ subject: subjectName, isDeleted: { $ne: true } });
        const quiz = new Quiz({ title: `Test ${existingCount + 1}`, subject: subjectName, description, author: authorId });
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
                timerSeconds: q.timerSeconds != null ? parseInt(q.timerSeconds) || null : null,
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
router.get("/analytics/sessions", Authentication, getSessionAnalytics)
router.get("/analytics/failed-questions", Authentication, getFailedQuestions)
router.get("/analytics/weak-topics", Authentication, getWeakTopics)
router.get("/analytics/user-performance", Authentication, getUserPerformanceSummary)

// Settings
router.get("/settings", getSettings)
router.put("/settings", Authentication, updateSettings)

// Certificate (public — accessible via QR code scan)
router.get("/certificate/:id", getCertificate)

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
