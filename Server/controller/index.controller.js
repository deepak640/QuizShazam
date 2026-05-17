var Quiz = require("../model/quiz");
var Response = require("../model/response");
var jwt = require("jsonwebtoken");
var axios = require("axios");
var bcrypt = require("bcryptjs");
var User = require("../model/user");
var Question = require("../model/question");
var Settings = require("../model/settings");
var userModel = require("../model/user");
const { default: mongoose } = require("mongoose");

const sendEmail = async (toEmail, link, type) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "QuizShazam", email: "ayushdeepnegi@gmail.com" },
        to: [{ email: toEmail }],
        ...(type === "password_reset"
          ? { templateId: 2, params: { password_link: link } }
          : { templateId: 3, params: { share_link: link } }),
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
    console.log("Email sent successfully to", toEmail);
  } catch (error) {
    console.error("Error sending email:", error.response?.data || error.message);
  }
};

const getAllusers = async (req, res) => {
  try {
    let pipeline = []
    let matchObj = {}
    matchObj.role = { $ne: "admin" }
    pipeline.push(
      {
        $match: matchObj,
      },
    )
    const users = await User.aggregate(pipeline).exec();
    res.status(200).send(users);
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).send({ message: "Error retrieving users", error });
  }
}

const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const quiz = await Quiz.findById(id).populate("questions");
    if (!quiz) return res.status(404).send({ message: "Quiz not found" });

    res.status(200).send(quiz);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving quiz", error });
  }
}

const sendResetLink = async (req, res) => {
  const { email } = req.body;
  try {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const password_link = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendEmail(email, password_link, "password_reset");
    return res.json({ message: "Email sent successfully", link: password_link });
  } catch (error) {
    res.status(500).send({ message: "Error processing request", error });
  }
}

const resetPassword = async (req, res) => {
  const { password } = req.body;

  try {
    const user = await User.findByIdAndUpdate(req.user.id, {
      password: bcrypt.hashSync(password, 10),
    });
    if (!user) return res.status(404).send({ message: "User not found" });
    return res.json({ message: "Password reset successfully!" })
  }
  catch (error) {
    return res.status(400).send({ message: error.message });
  }
}

const getUserStats = async (req, res) => {
  try {
    // if (req.user.role !== "admin") return res.status(401).send({ message: "Unauthorized access" });
    
    // Total normal quizzes count
    const result = await User.aggregate([
      { $unwind: "$quizzesTaken" },
      {
        $lookup: {
          from: "quizzes",
          localField: "quizzesTaken",
          foreignField: "_id",
          as: "quizInfo"
        }
      },
      { $unwind: "$quizInfo" },
      { $match: { "quizInfo.expiresAt": { $exists: false } } },
      { $group: { _id: null, totalQuizzes: { $sum: 1 } } }
    ]);

    const chart = await User.aggregate([
      {
        $unwind: "$quizzesTaken", // Flatten quizzesTaken array
      },
      {
        $lookup: {
          from: "quizzes", // Join with Quiz collection
          localField: "quizzesTaken",
          foreignField: "_id",
          as: "quizDetails",
        },
      },
      {
        $unwind: "$quizDetails", // Unwind the quiz details
      },
      {
        $match: {
          "quizDetails.expiresAt": { $exists: false } // Exclude assessments
        }
      },
      {
        $group: {
          _id: "$quizzesTaken", // Group by quiz ID
          count: { $sum: 1 }, // Count occurrences of each quiz
          title: { $first: "$quizDetails.title" }
        },
      },
      {
        $project: {
          _id: 0,
          title: 1, 
          count: 1,
        },
      },
      {
        $sort: { count: -1 }, // Sort by most taken quiz
      },
    ]);

    // Format data for chart
    const labels = chart.map((quiz) => quiz.title);
    const data = chart.map((quiz) => quiz.count);

    const chartData = {
      labels,
      datasets: [
        {
          label: "Quiz Categories",
          data,
        },
      ],
    };

    return res.status(200).send({ total: result[0]?.totalQuizzes || 0, byCategory: chartData });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).send({ message: "Error retrieving users", error });
  }
}

const createSession = async (req, res) => {
  const { quiz, session } = req.body;
  try {
    console.log(session, "session")
    const quizzes = await Promise.all(
      quiz.map(async ({ title, description, questions, authorId }) => {
        const quiz = new Quiz({ title, description, author: authorId });
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
        quiz.expiresAt = new Date(Date.now() + session * 60 * 1000);
        await quiz.save();
        return quiz;
      })
    );
    res.status(201).send({ success: true, message: "Quiz created successfully" });
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
  }
}

const getAllsession = async (req, res) => {
  try {
    const sessions = await Quiz.aggregate([
      { $match: { expiresAt: { $exists: true }, isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: "responses",
          localField: "_id",
          foreignField: "quiz",
          as: "responses",
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          createdAt: 1,
          expiresAt: 1,
          questionCount: { $size: "$questions" },
          submissionCount: { $size: "$responses" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sessions", error: error.message });
  }
};

const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [session] = await Quiz.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id), expiresAt: { $exists: true } } },
      {
        $lookup: { from: "responses", localField: "_id", foreignField: "quiz", as: "responses" },
      },
      {
        $project: {
          title: 1, description: 1, createdAt: 1, expiresAt: 1,
          questionCount: { $size: "$questions" },
          submissionCount: { $size: "$responses" },
        },
      },
    ]);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Error fetching session", error: error.message });
  }
};

const getSessionResults = async (req, res) => {
  try {
    const { id } = req.params;
    const results = await Response.find({ quiz: id })
      .populate("user", "username email photoURL")
      .populate("quiz", "title questions")
      .lean();

    const formatted = results.map((r) => ({
      _id: r._id,
      user: r.user,
      score: r.score,
      totalQuestions: r.quiz?.questions?.length || 0,
      accuracy: r.quiz?.questions?.length ? Math.round((r.score / r.quiz.questions.length) * 100) : 0,
      submittedAt: r.createdAt,
    }));

    res.json({ results: formatted });
  } catch (error) {
    res.status(500).json({ message: "Error fetching session results", error: error.message });
  }
};

const extendSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body;
    const mins = parseInt(minutes);
    if (isNaN(mins) || mins < 1 || mins > 480) {
      return res.status(400).json({ message: "Minutes must be between 1 and 480" });
    }
    const quiz = await Quiz.findOne({ _id: id, expiresAt: { $exists: true } });
    if (!quiz) return res.status(404).json({ message: "Session not found" });
    // Extend from now if already expired, or from current expiresAt
    const base = quiz.expiresAt < new Date() ? new Date() : quiz.expiresAt;
    quiz.expiresAt = new Date(base.getTime() + mins * 60 * 1000);
    await quiz.save();
    res.json({ message: "Session extended", expiresAt: quiz.expiresAt });
  } catch (error) {
    res.status(500).json({ message: "Error extending session", error: error.message });
  }
};

const getAllQuizzes = async (req, res) => {
  try {
    const { id } = req.user;
    let matchObj = {};
    matchObj.expiresAt = { $exists: false };
    matchObj.isDeleted = { $ne: true };
    // Use aggregation pipeline to get quizzes with selected fields
    const quizzes = await Quiz.aggregate([
      {
        $match: matchObj
      },
      {
        $project: {
          title: 1,
          subject: 1,
          description: 1,
          questions: 1,
          createdAt: 1
        }
      }
    ]);

    // Get only normal quizzesTaken for the user
    const quizzesTakenResult = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "quizzes",
          localField: "quizzesTaken",
          foreignField: "_id",
          as: "takenDetails"
        }
      },
      {
        $project: {
          quizzesTaken: {
            $filter: {
              input: "$takenDetails",
              as: "q",
              cond: { $not: ["$$q.expiresAt"] }
            }
          }
        }
      },
      {
        $project: {
          quizzesTaken: "$quizzesTaken._id"
        }
      }
    ]);
    const quizzesTaken = quizzesTakenResult[0] || { quizzesTaken: [] };

    res.status(200).send({ quizzes: quizzes, quizzesTaken });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error)
    res.status(500).send({ message: "Error retrieving quizzes", error });
  }
}

const shareQuiz = async (req, res) => {
  // console.log(req.body, "req.body")
  try {
    const { users, message, quizId } = req.body;
    console.log(quizId, "quizId")
    await Promise.all(
      await users.map(async (mail) => {
        await sendEmail(mail, `${process.env.CLIENT_URL}/dashboard/quiz/${quizId}`, "Share");
      }))
    res.json({ message: "Email sent successfully" })
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error)
    res.status(500).send({ message: "Error retrieving quizzes", error });
  }
}

const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { explanation, referenceLink, topic, difficulty, questionText, options, questionType, isMultiSelect } = req.body;
  try {
    const update = {};
    if (explanation !== undefined) update.explanation = explanation || null;
    if (referenceLink !== undefined) update.referenceLink = referenceLink || null;
    if (topic !== undefined) update.topic = topic || null;
    if (difficulty !== undefined && ["easy", "medium", "hard"].includes(difficulty)) update.difficulty = difficulty;
    if (questionText !== undefined && questionText.trim()) update.questionText = questionText.trim();
    if (Array.isArray(options) && options.length > 0) update.options = options;
    if (questionType !== undefined && ["mcq", "multi", "true_false"].includes(questionType)) update.questionType = questionType;
    if (isMultiSelect !== undefined) update.isMultiSelect = !!isMultiSelect;
    if (req.body.marks !== undefined && req.body.marks >= 1) update.marks = parseInt(req.body.marks);

    const question = await Question.findByIdAndUpdate(id, update, { new: true });
    if (!question) return res.status(404).send({ message: "Question not found" });
    res.status(200).send(question);
  } catch (error) {
    res.status(500).send({ message: "Error updating question", error });
  }
};

const updateQuiz = async (req, res) => {
  const { id } = req.params;
  const { title, description, subject, timerMinutes, allowPreviousQuestion, passingPercentage, proctoring } = req.body;
  try {
    const update = {};
    if (title !== undefined && title.trim()) update.title = title.trim();
    if (description !== undefined) update.description = description;
    if (subject !== undefined && subject.trim()) update.subject = subject.trim();
    if (timerMinutes !== undefined) {
      const val = parseInt(timerMinutes);
      if (!isNaN(val) && val >= 1) update.timerMinutes = val;
    }
    if (allowPreviousQuestion !== undefined) {
      update.allowPreviousQuestion = Boolean(allowPreviousQuestion);
    }
    if (passingPercentage !== undefined) {
      const val = parseInt(passingPercentage);
      if (!isNaN(val) && val >= 1 && val <= 100) update.passingPercentage = val;
    }
    if (proctoring !== undefined && typeof proctoring === "object") {
      update.proctoring = {
        enabled: Boolean(proctoring.enabled),
        detectTabSwitch: proctoring.detectTabSwitch !== false,
        fullscreenRequired: proctoring.fullscreenRequired !== false,
        detectFullscreenExit: proctoring.detectFullscreenExit !== false,
        blockCopyPaste: proctoring.blockCopyPaste !== false,
        disableRightClick: proctoring.disableRightClick !== false,
        maxViolations: Math.max(1, parseInt(proctoring.maxViolations) || 3),
        autoSubmitOnViolationLimit: proctoring.autoSubmitOnViolationLimit !== false,
      };
    }

    const quiz = await Quiz.findByIdAndUpdate(id, update, { new: true });
    if (!quiz) return res.status(404).send({ message: "Quiz not found" });
    res.status(200).send(quiz);
  } catch (error) {
    res.status(500).send({ message: "Error updating quiz", error });
  }
};

const getFailedQuestions = async (req, res) => {
  try {
    const minAttempts = parseInt(req.query.minAttempts) || 1;
    const threshold = parseInt(req.query.threshold) || 70;

    const results = await Response.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz",
          foreignField: "_id",
          as: "quizDetails",
        },
      },
      { $unwind: "$quizDetails" },
      { $match: { "quizDetails.expiresAt": { $exists: false } } },
      { $unwind: "$answers" },
      {
        $lookup: {
          from: "questions",
          localField: "answers.questionId",
          foreignField: "_id",
          as: "question",
        },
      },
      { $unwind: "$question" },
      {
        $addFields: {
          selectedOpt: { $arrayElemAt: ["$question.options", "$answers.selectedOption"] },
        },
      },
      {
        $addFields: {
          isCorrect: { $eq: ["$selectedOpt.isCorrect", true] },
        },
      },
      {
        $group: {
          _id: "$answers.questionId",
          questionText: { $first: "$question.questionText" },
          topic: { $first: "$question.topic" },
          difficulty: { $first: "$question.difficulty" },
          explanation: { $first: "$question.explanation" },
          totalAttempts: { $sum: 1 },
          wrongAttempts: { $sum: { $cond: ["$isCorrect", 0, 1] } },
        },
      },
      {
        $addFields: {
          failureRate: {
            $round: [{ $multiply: [{ $divide: ["$wrongAttempts", "$totalAttempts"] }, 100] }, 0],
          },
        },
      },
      { $match: { failureRate: { $gte: threshold }, totalAttempts: { $gte: minAttempts } } },
      { $sort: { failureRate: -1 } },
      { $limit: 20 },
    ]);

    res.status(200).send(results);
  } catch (error) {
    console.error("getFailedQuestions error:", error.message, error.stack);
    res.status(500).send({ message: "Error retrieving analytics", error: error.message });
  }
};

const getWeakTopics = async (req, res) => {
  try {
    const matchStage = {};
    // ?global=true → admin view (all users). Otherwise scope to the logged-in user.
    if (req.query.global !== "true") {
      matchStage.user = req.user.id;
    }

    const results = await Response.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz",
          foreignField: "_id",
          as: "quizDetails",
        },
      },
      { $unwind: "$quizDetails" },
      { $match: { "quizDetails.expiresAt": { $exists: false } } },
      { $unwind: "$answers" },
      {
        $lookup: {
          from: "questions",
          localField: "answers.questionId",
          foreignField: "_id",
          as: "question",
        },
      },
      { $unwind: "$question" },
      { $match: { "question.topic": { $ne: null, $exists: true } } },
      {
        $addFields: {
          selectedOpt: { $arrayElemAt: ["$question.options", "$answers.selectedOption"] },
        },
      },
      {
        $addFields: {
          isCorrect: { $eq: ["$selectedOpt.isCorrect", true] },
        },
      },
      {
        $group: {
          _id: "$question.topic",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
      {
        $addFields: {
          accuracy: { $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 0] },
        },
      },
      { $sort: { accuracy: 1 } },
    ]);

    const weakTopics = results.map((r) => ({ topic: r._id, accuracy: r.accuracy, total: r.total }));
    res.status(200).send({ weakTopics });
  } catch (error) {
    console.error("getWeakTopics error:", error.message, error.stack);
    res.status(500).send({ message: "Error retrieving weak topics", error: error.message });
  }
};

const getUserPerformanceSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const summary = await Response.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz",
          foreignField: "_id",
          as: "quizDetails",
        },
      },
      { $unwind: "$quizDetails" },
      { $match: { "quizDetails.expiresAt": { $exists: false } } },
      {
        $group: {
          _id: "$user",
          attempts: { $sum: 1 },
          avgScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          lastAttempt: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $project: {
          _id: 1,
          username: { $arrayElemAt: ["$userDetails.username", 0] },
          email: { $arrayElemAt: ["$userDetails.email", 0] },
          attempts: 1,
          avgScore: { $round: ["$avgScore", 1] },
          bestScore: 1,
          lastAttempt: 1,
        },
      },
      { $sort: { attempts: -1 } },
    ]);

    // Time-based activity
    const activity = await Response.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz",
          foreignField: "_id",
          as: "quizDetails",
        },
      },
      { $unwind: "$quizDetails" },
      { $match: { "quizDetails.expiresAt": { $exists: false } } },
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: "$score" } } }
          ],
          week: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: "$score" } } }
          ],
          month: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: "$score" } } }
          ],
          trend: [
            { $match: { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                attempts: { $sum: 1 },
                avgScore: { $avg: "$score" }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    res.status(200).send({
      userSummary: summary,
      activity: activity[0]
    });
  } catch (error) {
    console.error("getUserPerformanceSummary error:", error);
    res.status(500).send({ message: "Error retrieving performance summary", error });
  }
};

const getSessionAnalytics = async (req, res) => {
  try {
    // All session quizzes
    const sessionQuizIds = await Quiz.find({ expiresAt: { $exists: true }, isDeleted: { $ne: true } }, "_id questions expiresAt createdAt title").lean();
    const sessionIds = sessionQuizIds.map((q) => q._id);

    // Responses for session quizzes only
    const sessionResponses = await Response.find({ quiz: { $in: sessionIds } }).lean();

    const totalSessions = sessionQuizIds.length;
    const totalSubmissions = sessionResponses.length;
    const avgAccuracy = totalSubmissions > 0
      ? Math.round(sessionResponses.reduce((sum, r) => {
          const quiz = sessionQuizIds.find((q) => q._id.toString() === r.quiz.toString());
          const total = quiz?.questions?.length || 1;
          return sum + (r.score / total) * 100;
        }, 0) / totalSubmissions)
      : 0;
    const activeSessions = sessionQuizIds.filter((q) => q.expiresAt > new Date()).length;

    // Per-session breakdown
    const sessionBreakdown = sessionQuizIds.map((quiz) => {
      const responses = sessionResponses.filter((r) => r.quiz.toString() === quiz._id.toString());
      const totalQ = quiz.questions?.length || 1;
      const avgAcc = responses.length
        ? Math.round(responses.reduce((s, r) => s + (r.score / totalQ) * 100, 0) / responses.length)
        : 0;
      const topScore = responses.length ? Math.max(...responses.map((r) => Math.round((r.score / totalQ) * 100))) : 0;
      return {
        _id: quiz._id,
        title: quiz.title,
        submissions: responses.length,
        avgAccuracy: avgAcc,
        topScore,
        isExpired: quiz.expiresAt < new Date(),
        createdAt: quiz.createdAt,
        expiresAt: quiz.expiresAt,
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Top students across all sessions (by total score across sessions)
    const userScoreMap = {};
    for (const r of sessionResponses) {
      const uid = r.user.toString();
      if (!userScoreMap[uid]) userScoreMap[uid] = { totalScore: 0, totalQ: 0, sessions: 0 };
      const quiz = sessionQuizIds.find((q) => q._id.toString() === r.quiz.toString());
      userScoreMap[uid].totalScore += r.score;
      userScoreMap[uid].totalQ += quiz?.questions?.length || 1;
      userScoreMap[uid].sessions += 1;
    }
    const userIds = Object.keys(userScoreMap);
    const users = await require("../model/user").find({ _id: { $in: userIds } }, "username email photoURL").lean();
    const topStudents = users.map((u) => {
      const stats = userScoreMap[u._id.toString()];
      return {
        _id: u._id,
        username: u.username,
        email: u.email,
        sessions: stats.sessions,
        avgAccuracy: Math.round((stats.totalScore / stats.totalQ) * 100),
      };
    }).sort((a, b) => b.avgAccuracy - a.avgAccuracy).slice(0, 10);

    // Submission trend last 14 days
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const trendMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      trendMap[d.toISOString().slice(0, 10)] = 0;
    }
    for (const r of sessionResponses) {
      if (r.createdAt >= cutoff) {
        const day = r.createdAt.toISOString().slice(0, 10);
        if (trendMap[day] !== undefined) trendMap[day]++;
      }
    }
    const trend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

    res.json({ totalSessions, totalSubmissions, avgAccuracy, activeSessions, sessionBreakdown, topStudents, trend });
  } catch (error) {
    console.error("getSessionAnalytics error:", error);
    res.status(500).json({ message: "Error fetching session analytics", error: error.message });
  }
};

// ─── Leaderboard helpers ──────────────────────────────────────────────────────

const userProjection = {
  "user.username": 1,
  "user.email": 1,
  "user.photoURL": 1,
};

const getGlobalLeaderboard = async (req, res) => {
  try {
    const rows = await Response.aggregate([
      { $match: { user: { $exists: true, $ne: null } } },
      { $group: { _id: "$user", totalScore: { $sum: "$score" }, quizzesTaken: { $sum: 1 }, avgScore: { $avg: "$score" } } },
      { $sort: { totalScore: -1 } },
      { $limit: 100 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      { $project: { totalScore: 1, quizzesTaken: 1, avgScore: { $round: ["$avgScore", 1] }, ...userProjection } },
    ]);
    res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
  } catch (error) {
    res.status(500).json({ message: "Error fetching global leaderboard", error: error.message });
  }
};

const getWeeklyLeaderboard = async (req, res) => {
  try {
    const now = new Date();
    const day = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const rows = await Response.aggregate([
      { $match: { user: { $exists: true, $ne: null }, createdAt: { $gte: startOfWeek } } },
      { $group: { _id: "$user", totalScore: { $sum: "$score" }, quizzesTaken: { $sum: 1 }, avgScore: { $avg: "$score" } } },
      { $sort: { totalScore: -1 } },
      { $limit: 100 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      { $project: { totalScore: 1, quizzesTaken: 1, avgScore: { $round: ["$avgScore", 1] }, ...userProjection } },
    ]);
    res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
  } catch (error) {
    res.status(500).json({ message: "Error fetching weekly leaderboard", error: error.message });
  }
};

const getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(quizId))
      return res.status(400).json({ message: "Invalid quiz ID" });

    const rows = await Response.aggregate([
      { $match: { quiz: new mongoose.Types.ObjectId(quizId), user: { $exists: true, $ne: null } } },
      { $sort: { score: -1, createdAt: 1 } },
      { $group: { _id: "$user", bestScore: { $first: "$score" }, attempts: { $sum: 1 }, lastAttempt: { $max: "$createdAt" } } },
      { $sort: { bestScore: -1 } },
      { $limit: 100 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      { $project: { bestScore: 1, attempts: 1, lastAttempt: 1, ...userProjection } },
    ]);
    res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
  } catch (error) {
    res.status(500).json({ message: "Error fetching quiz leaderboard", error: error.message });
  }
};

const getSubjectLeaderboard = async (req, res) => {
  try {
    const subject = decodeURIComponent(req.params.subject);
    const rows = await Response.aggregate([
      { $match: { user: { $exists: true, $ne: null } } },
      { $lookup: { from: "quizzes", localField: "quiz", foreignField: "_id", as: "quizData" } },
      { $unwind: "$quizData" },
      { $match: { "quizData.subject": subject, "quizData.isDeleted": { $ne: true } } },
      { $group: { _id: "$user", totalScore: { $sum: "$score" }, quizzesTaken: { $sum: 1 }, avgScore: { $avg: "$score" } } },
      { $sort: { totalScore: -1 } },
      { $limit: 100 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      { $project: { totalScore: 1, quizzesTaken: 1, avgScore: { $round: ["$avgScore", 1] }, ...userProjection } },
    ]);
    res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
  } catch (error) {
    res.status(500).json({ message: "Error fetching subject leaderboard", error: error.message });
  }
};

const getLeaderboardSubjects = async (req, res) => {
  try {
    const subjects = await Quiz.distinct("subject", { isDeleted: { $ne: true }, subject: { $ne: null } });
    res.json(subjects.sort());
  } catch (error) {
    res.status(500).json({ message: "Error fetching subjects", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings", error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { quizTimerSeconds, defaultTimerMinutes, allowPreviousQuestion, proctoring } = req.body;
    const update = {};

    if (quizTimerSeconds !== undefined) {
      const val = parseInt(quizTimerSeconds);
      if (isNaN(val) || val < 5 || val > 120)
        return res.status(400).json({ message: "Timer must be between 5 and 120 seconds" });
      update.quizTimerSeconds = val;
    }
    if (defaultTimerMinutes !== undefined) {
      const val = parseInt(defaultTimerMinutes);
      if (isNaN(val) || val < 1 || val > 180)
        return res.status(400).json({ message: "Default timer must be between 1 and 180 minutes" });
      update.defaultTimerMinutes = val;
    }
    if (allowPreviousQuestion !== undefined) {
      update.allowPreviousQuestion = Boolean(allowPreviousQuestion);
    }
    if (proctoring !== undefined && typeof proctoring === "object") {
      update.proctoring = {
        enabled:                    Boolean(proctoring.enabled),
        detectTabSwitch:            proctoring.detectTabSwitch !== false,
        fullscreenRequired:         proctoring.fullscreenRequired !== false,
        detectFullscreenExit:       proctoring.detectFullscreenExit !== false,
        blockCopyPaste:             proctoring.blockCopyPaste !== false,
        disableRightClick:          proctoring.disableRightClick !== false,
        maxViolations:              Math.max(1, parseInt(proctoring.maxViolations) || 3),
        autoSubmitOnViolationLimit: proctoring.autoSubmitOnViolationLimit !== false,
      };
    }

    const settings = await Settings.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Error updating settings", error: error.message });
  }
};

const getDailyChallenge = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isDeleted: { $ne: true }, expiresAt: null }).select("_id title subject");
    if (!quizzes.length) return res.status(404).json({ error: "No quizzes available" });

    // Deterministic pick: days since epoch mod quiz count
    const dayIndex = Math.floor(Date.now() / 86400000);
    const quiz = quizzes[dayIndex % quizzes.length];

    // Next reset at midnight UTC
    const now = new Date();
    const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

    // Check if requesting user already completed it today
    let completedToday = false;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("dailyChallengeDate");
        const today = now.toISOString().slice(0, 10);
        completedToday = user?.dailyChallengeDate === today;
      } catch (_) {}
    }

    res.json({ quiz, completedToday, nextReset });
  } catch (e) {
    res.status(500).json({ error: "Failed to get daily challenge" });
  }
};

const getCertificate = async (req, res) => {
  const { id } = req.params;
  try {
    const response = await Response.findById(id)
      .populate("user", "username email")
      .populate("quiz", "title subject passingPercentage")
      .populate("answers.questionId", "options isMultiSelect marks");

    if (!response) return res.status(404).json({ error: "Certificate not found" });

    const totalQuestions = response.answers.length;

    // Recalculate marks the same way the profile page does.
    let earnedMarks = 0;
    let totalMarks = 0;
    let correctCount = 0;
    for (const a of response.answers) {
      const q = a.questionId;
      if (!q) continue;
      const qMarks = q.marks ?? 1;
      totalMarks += qMarks;
      let isCorrect = false;
      if (q.isMultiSelect) {
        const correctIndices = q.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i !== -1);
        const selected = Array.isArray(a.selectedOptions) ? a.selectedOptions : [];
        isCorrect = correctIndices.length > 0 &&
          correctIndices.every(i => selected.includes(i)) &&
          selected.every(i => correctIndices.includes(i));
      } else {
        const correctIdx = q.options.findIndex(o => o.isCorrect);
        isCorrect = a.selectedOption === correctIdx;
      }
      if (isCorrect) { earnedMarks += qMarks; correctCount++; }
    }

    const percentage = totalMarks ? Math.round((earnedMarks / totalMarks) * 100) : 0;

    const passingPercentage = response.quiz?.passingPercentage ?? 70;
    if (percentage < passingPercentage) {
      return res.status(403).json({
        error: "not_passed",
        message: "You have not passed this quiz",
        percentage,
        passingPercentage,
        score: earnedMarks,
        totalMarks,
        quizId: response.quiz?._id,
      });
    }

    res.json({
      certificateId: response._id,
      studentName: response.user?.username || response.user?.email?.split("@")[0] || "Student",
      quizTitle: response.quiz?.title || "Quiz",
      quizSubject: response.quiz?.subject || "",
      score: earnedMarks,
      totalMarks,
      totalQuestions,
      percentage,
      completedAt: response.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAllusers,
  getById,
  getAllQuizzes,
  createSession,
  shareQuiz,
  getUserStats,
  getAllsession,
  getSessionById,
  getSessionResults,
  extendSession,
  sendResetLink,
  resetPassword,
  updateQuestion,
  updateQuiz,
  getFailedQuestions,
  getWeakTopics,
  getUserPerformanceSummary,
  getSettings,
  updateSettings,
  getSessionAnalytics,
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getQuizLeaderboard,
  getSubjectLeaderboard,
  getLeaderboardSubjects,
  getCertificate,
  getDailyChallenge,
}
