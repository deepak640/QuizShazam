const ProctorLog = require("../model/proctorLog");
const Settings = require("../model/settings");
const mongoose = require("mongoose");

// POST /proctor/log — student logs a violation
const logViolation = async (req, res) => {
  const { quizId, sessionId, eventType, metadata } = req.body;
  const userId = req.user.id;

  const VALID_EVENTS = ["TAB_SWITCH", "FULLSCREEN_EXIT", "COPY_ATTEMPT", "PASTE_ATTEMPT", "CUT_ATTEMPT", "RIGHT_CLICK", "WINDOW_BLUR", "AUTO_SUBMIT"];
  if (!VALID_EVENTS.includes(eventType)) {
    return res.status(400).json({ error: "Invalid eventType" });
  }
  if (!quizId) return res.status(400).json({ error: "quizId required" });

  // Debounce: block duplicate of same event within 1 second
  const oneSecAgo = new Date(Date.now() - 1000);
  const recent = await ProctorLog.findOne({
    userId, quizId, eventType, createdAt: { $gte: oneSecAgo },
  });
  if (recent) return res.status(200).json({ duplicate: true });

  const log = await ProctorLog.create({
    userId,
    quizId,
    sessionId: sessionId || null,
    eventType,
    metadata: metadata || {},
  });

  // Return current violation count for this quiz session
  const count = await ProctorLog.countDocuments({
    userId,
    quizId,
    eventType: { $ne: "AUTO_SUBMIT" },
  });

  res.status(201).json({ logged: true, violationCount: count, logId: log._id });
};

// GET /proctor/session?quizId=&userId= — get violations for a quiz (admin or self)
const getSessionViolations = async (req, res) => {
  const { quizId, userId } = req.query;
  const requesterId = req.user.id;
  const isAdmin = req.user.role === "admin";

  const targetUserId = userId || requesterId;
  if (!isAdmin && targetUserId.toString() !== requesterId.toString()) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const filter = {};
  if (quizId) filter.quizId = new mongoose.Types.ObjectId(quizId);
  if (targetUserId) filter.userId = new mongoose.Types.ObjectId(targetUserId);

  const logs = await ProctorLog.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  const count = await ProctorLog.countDocuments({ ...filter, eventType: { $ne: "AUTO_SUBMIT" } });

  res.json({ logs, violationCount: count });
};

// GET /proctor/admin/report — admin: all sessions with violations
const getAdminReport = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });

  const { quizId, page = 1, limit = 20 } = req.query;
  const match = {};
  if (quizId) match.quizId = new mongoose.Types.ObjectId(quizId);

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const report = await ProctorLog.aggregate([
    { $match: { ...match, eventType: { $ne: "AUTO_SUBMIT" } } },
    {
      $group: {
        _id: { userId: "$userId", quizId: "$quizId" },
        violationCount: { $sum: 1 },
        events: { $push: { type: "$eventType", at: "$createdAt" } },
        firstAt: { $min: "$createdAt" },
        lastAt: { $max: "$createdAt" },
      },
    },
    { $sort: { violationCount: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
    {
      $lookup: { from: "users", localField: "_id.userId", foreignField: "_id", as: "user" },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $lookup: { from: "quizzes", localField: "_id.quizId", foreignField: "_id", as: "quiz" },
    },
    { $unwind: { path: "$quiz", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        violationCount: 1,
        events: { $slice: ["$events", 20] },
        firstAt: 1,
        lastAt: 1,
        "user.username": 1,
        "user.email": 1,
        "quiz.title": 1,
        "quiz.subject": 1,
      },
    },
  ]);

  // Attach risk level
  const withRisk = report.map(r => ({
    ...r,
    riskLevel: r.violationCount <= 1 ? "low" : r.violationCount <= 4 ? "medium" : "high",
  }));

  const total = await ProctorLog.aggregate([
    { $match: { ...match, eventType: { $ne: "AUTO_SUBMIT" } } },
    { $group: { _id: { userId: "$userId", quizId: "$quizId" } } },
    { $count: "total" },
  ]);

  res.json({ report: withRisk, total: total[0]?.total || 0, page: parseInt(page), limit: parseInt(limit) });
};

// GET /proctor/config — global proctoring config (used by all quizzes)
const getQuizProctoringConfig = async (req, res) => {
  const settings = await Settings.findOne().lean();
  res.json({ proctoring: settings?.proctoring || { enabled: false } });
};

module.exports = { logViolation, getSessionViolations, getAdminReport, getQuizProctoringConfig };
