const mongoose = require("mongoose");
const QuizSession = require("../model/quizSession");
const Quiz = require("../model/quiz");

const SESSION_INACTIVITY_HOURS = 24;

// ── GET /users/quiz-session/:quizId ──────────────────────────────────────────
// Returns { session, isNew }
// Creates a new session if none exists.
// Expires stale sessions automatically.
const getOrCreateSession = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(quizId))
    return res.status(400).json({ message: "Invalid quiz ID" });

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.isDeleted)
      return res.status(404).json({ message: "Quiz not found" });

    // If this is a session-assessment quiz that has already expired, reject immediately
    if (quiz.expiresAt && quiz.expiresAt < new Date())
      return res.status(403).json({ message: "Session has expired" });

    let session = await QuizSession.findOne({ userId, quizId });

    if (session) {
      // Auto-expire stale in_progress sessions
      if (session.status === "in_progress") {
        const hoursSinceActive =
          (Date.now() - session.lastActiveAt.getTime()) / 3_600_000;
        if (hoursSinceActive > SESSION_INACTIVITY_HOURS) {
          session.status = "expired";
          await session.save();
          // Fall through to create a fresh one
        } else {
          return res.json({ session, isNew: false });
        }
      }

      // Already submitted or just expired — don't resume
      if (session.status === "submitted" || session.status === "expired") {
        // Delete so user can attempt again (only for non-session-assessment quizzes)
        if (!quiz.expiresAt) {
          await QuizSession.deleteOne({ _id: session._id });
        } else {
          return res.json({ session: null, isNew: true });
        }
      }
    }

    // Create fresh session
    session = await QuizSession.create({
      userId,
      quizId,
      answers: [],
      currentIndex: 0,
      startedAt: new Date(),
      lastActiveAt: new Date(),
    });

    return res.json({ session, isNew: true });
  } catch (err) {
    if (err.code === 11000) {
      // Race condition — another request already created it, just fetch
      const existing = await QuizSession.findOne({ userId, quizId });
      return res.json({ session: existing, isNew: false });
    }
    console.error("getOrCreateSession error:", err);
    res.status(500).json({ message: "Error managing quiz session", error: err.message });
  }
};

// ── PATCH /users/quiz-session/:quizId/save ───────────────────────────────────
// Saves current answers and question index.
const saveProgress = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;
  const { answers, currentIndex } = req.body;

  if (!mongoose.Types.ObjectId.isValid(quizId))
    return res.status(400).json({ message: "Invalid quiz ID" });

  try {
    const session = await QuizSession.findOne({
      userId,
      quizId,
      status: "in_progress",
    });

    if (!session)
      return res.status(404).json({ message: "No active session found" });

    // Merge answers — update existing entries, append new ones
    if (Array.isArray(answers)) {
      const now = new Date();
      answers.forEach((incoming) => {
        const idx = session.answers.findIndex(
          (a) => String(a.questionId) === String(incoming.questionId)
        );
        const entry = {
          questionId: incoming.questionId,
          selectedOption: incoming.selectedOption ?? null,
          selectedOptions: incoming.selectedOptions ?? [],
          savedAt: now,
        };
        if (idx >= 0) session.answers[idx] = entry;
        else session.answers.push(entry);
      });
      session.markModified("answers");
    }

    if (typeof currentIndex === "number") session.currentIndex = currentIndex;
    session.lastActiveAt = new Date();

    await session.save();
    res.json({ success: true, savedAt: session.lastActiveAt });
  } catch (err) {
    console.error("saveProgress error:", err);
    res.status(500).json({ message: "Error saving progress", error: err.message });
  }
};

// ── DELETE /users/quiz-session/:quizId ───────────────────────────────────────
// Discards (deletes) the active session so user starts fresh.
const discardSession = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(quizId))
    return res.status(400).json({ message: "Invalid quiz ID" });

  try {
    await QuizSession.findOneAndDelete({ userId, quizId, status: "in_progress" });
    res.json({ success: true });
  } catch (err) {
    console.error("discardSession error:", err);
    res.status(500).json({ message: "Error discarding session", error: err.message });
  }
};

// ── Internal helper: mark session submitted ───────────────────────────────────
// Called from quizSubmission after a successful submission.
const markSessionSubmitted = async (userId, quizId) => {
  try {
    await QuizSession.findOneAndUpdate(
      { userId, quizId },
      { status: "submitted", submittedAt: new Date() }
    );
  } catch (err) {
    // Non-fatal — submission already succeeded, just log
    console.error("markSessionSubmitted error:", err);
  }
};

module.exports = {
  getOrCreateSession,
  saveProgress,
  discardSession,
  markSessionSubmitted,
};
