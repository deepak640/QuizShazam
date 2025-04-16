var Quiz = require("../model/quiz");
var jwt = require("jsonwebtoken");
var SibApiV3Sdk = require("sib-api-v3-sdk");
var bcrypt = require("bcryptjs");
var User = require("../model/user");
var Question = require("../model/question");

const sendEmail = async (toEmail, passwordLink) => {
  try {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.sender = { name: "quizShazam", email: "ayushdeepnegi@gmail.com" }; // Must be verified in Brevo

    // **Use the Email Template**
    sendSmtpEmail.templateId = 2; // Replace with your Brevo Template ID
    sendSmtpEmail.params = {
      password_link: passwordLink, // Matches the variable used in your template
    };

    let response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const getAllusers = async (req, res) => {
  try {
    const users = await User.find();
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
    sendEmail(email, password_link);
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
  const array = req.body;
  console.log(array)
  try {
    // const quizzes = await Promise.all(
    //   array.map(async ({ title, description, questions, authorId }) => {
    //     const quiz = new Quiz({ title, description, author: authorId });
    //     await quiz.save();

    //     await Promise.all(
    //       questions
    //         .filter((q) => {
    //           return q.questionText != undefined;
    //         })
    //         .map(async (q) => {
    //           const question = new Question({
    //             questionText: q.questionText,
    //             options: q.options,
    //             quiz: quiz._id,
    //           });
    //           await question.save();
    //           quiz.questions.push(question);
    //         })
    //     );

    //     await quiz.save();
    //     return quiz;
    //   })
    // );

    res.status(201).send({ message: "Quiz created successfully" });
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
  }
}

module.exports = {
  getAllusers,
  getById,
  createSession,
  getUserStats,
  sendResetLink,
  resetPassword
}
