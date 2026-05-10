var Quiz = require("../model/quiz");
var Response = require("../model/response");
var jwt = require("jsonwebtoken");
var axios = require("axios");
var bcrypt = require("bcryptjs");
var User = require("../model/user");
var Question = require("../model/question");
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
    let pipeline = []
    pipeline.push(
      { $unwind: "$quizzesTaken" }, // Flatten the quizzesTaken array
      { $group: { _id: null, totalQuizzes: { $sum: 1 } } } // Count total quizzes
    );
    const result = await User.aggregate(pipeline);

    const chart = await User.aggregate([
      {
        $unwind: "$quizzesTaken", // Flatten quizzesTaken array
      },
      {
        $group: {
          _id: "$quizzesTaken", // Group by quiz ID
          count: { $sum: 1 }, // Count occurrences of each quiz
        },
      },
      {
        $lookup: {
          from: "quizzes", // Join with Quiz collection
          localField: "_id",
          foreignField: "_id",
          as: "quizDetails",
        },
      },
      {
        $unwind: "$quizDetails", // Unwind the quiz details
      },
      {
        $project: {
          _id: 0,
          title: "$quizDetails.title", // Extract quiz title
          count: 1, // Keep count
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


    return res.status(200).send({ total: result[0].totalQuizzes, byCategory: chartData });
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
  let pipeline = []
  let matchObj = {}
  matchObj.expiresAt = { $exists: true }

  pipeline.push(
    {
      $match: matchObj,
    },
    {
      $project: {
        title: 1,
        description: 1,
        createdAt: 1,
        _id: 1,
        expiresAt: 1,
      }
    }
  )

  const Quizez = await Quiz.aggregate(pipeline);
  res.json(Quizez)
}

const getAllQuizzes = async (req, res) => {
  try {
    const { id } = req.user;
    let matchObj = {};
    matchObj.expiresAt = { $exists: false };
    // Use aggregation pipeline to get quizzes with selected fields
    const quizzes = await Quiz.aggregate([
      {
        $match: matchObj
      },
      {
        $project: {
          title: 1,
          description: 1,
          questions: 1,
          createdAt: 1
        }
      }
    ]);

    // Get quizzesTaken for the user
    const quizzesTakenResult = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      { $project: { quizzesTaken: 1 } }
    ]);
    const quizzesTaken = quizzesTakenResult[0] || [];

    res.status(200).send({ quizzes: quizzes, quizzesTaken });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error)
    res.status(500).send({ message: "Error retrieving quizzes", error });
  }
}

const shareQuiz = async (req, res) => {
  if (req.user.role !== "admin") return res.status(401).send({ message: "Unauthorized access" });
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
  const { explanation, referenceLink, topic, difficulty } = req.body;
  try {
    const update = {};
    if (explanation !== undefined) update.explanation = explanation || null;
    if (referenceLink !== undefined) update.referenceLink = referenceLink || null;
    if (topic !== undefined) update.topic = topic || null;
    if (difficulty !== undefined && ["easy", "medium", "hard"].includes(difficulty)) update.difficulty = difficulty;

    const question = await Question.findByIdAndUpdate(id, update, { new: true });
    if (!question) return res.status(404).send({ message: "Question not found" });
    res.status(200).send(question);
  } catch (error) {
    res.status(500).send({ message: "Error updating question", error });
  }
};

const getFailedQuestions = async (req, res) => {
  try {
    const minAttempts = parseInt(req.query.minAttempts) || 1;
    const threshold = parseInt(req.query.threshold) || 70;

    const results = await Response.aggregate([
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

module.exports = {
  getAllusers,
  getById,
  getAllQuizzes,
  createSession,
  shareQuiz,
  getUserStats,
  getAllsession,
  sendResetLink,
  resetPassword,
  updateQuestion,
  getFailedQuestions,
  getWeakTopics,
}
