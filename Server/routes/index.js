var express = require("express");
var router = express.Router();
var Quiz = require("../model/quiz");
var Question = require("../model/question");
var userModel = require("../model/user");
var Authentication = require("../middleware/auth");
var jwt = require("jsonwebtoken");
var SibApiV3Sdk = require("sib-api-v3-sdk");

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

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/create-quiz", Authentication, async (req, res) => {
  const array = req.body;
  try {
    const quizzes = await Promise.all(
      array.map(async ({ title, description, questions, authorId }) => {
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
              });
              await question.save();
              quiz.questions.push(question);
            })
        );

        await quiz.save();
        return quiz;
      })
    );

    res.status(201).send({ message: "Quiz created successfully", quizzes });
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
    res.status(500).send({ message: "Error creating quiz", error });
  }
});

// Get all quizzes
router.get("/quizzes", Authentication, async (req, res) => {
  try {
    const { id } = req.user;
    console.log("🚀 ~ router.get ~ id:", id);
    const quizzes = await Quiz.find().select("title description questions");
    const quizzesTaken = await userModel.findById(id).select("quizzesTaken");
    res.status(200).send({ quizzes, quizzesTaken });
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error)
    res.status(500).send({ message: "Error retrieving quizzes", error });
  }
});

router.get("/getAllQuizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find();
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
router.get("/users", async (req, res) => {
  try {
    const users = await userModel.find();
    res.status(200).send(users);
  } catch (error) {
    console.log("🚀 ~ router.get ~ error:", error);
    res.status(500).send({ message: "Error retrieving users", error });
  }
});

// Get quiz by ID
router.get("/quiz/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const quiz = await Quiz.findById(id).populate("questions");
    if (!quiz) return res.status(404).send({ message: "Quiz not found" });

    res.status(200).send(quiz);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving quiz", error });
  }
});


router.post("/password", Authentication, async (req, res) => {
  const { email } = req.body;
  try {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("🚀 ~ router.post ~ password_link", process.env.JWT_SECRET, token);

    const password_link = `${process.env.CLIENT_URL}/reset-password/${token}`;
    console.log(password_link)
    return res.json({ message: "Email sent successfully", link: password_link });
  } catch (error) {
    res.status(500).send({ message: "Error processing request", error });
  }
}
);

router.post("/reset-password", Authentication, async (req, res) => {
  const { password } = req.body;

  try {
    const user = await userModel.findByIdAndUpdate(req.user.id, {
      password: password,
    });
    sendEmail(user.email, "Password reset successfully!");
    if (!user) return res.status(404).send({ message: "User not found" });
    return res.json({ message: "Password reset successfully!" })
  }
  catch (error) {
    return res.status(400).send({ message: error.message });
  }
})
module.exports = router;
