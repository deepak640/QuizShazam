var express = require("express");
var router = express.Router();
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var Authentication = require("../middleware/auth");
var UserModel = require("../model/user");
const Quiz = require("../model/quiz");
const Question = require("../model/question");
const Result = require("../model/response");
/* GET users listing. */
var salt = bcrypt.genSaltSync(10);

router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const exist = await UserModel.findOne({ email });
    if (exist) {
      return res.status(401).json({ error: "User already exists" });
    }

    const newUser = new UserModel({
      username,
      email,
      password: password ? bcrypt.hashSync(password, salt) : undefined,
      googleAuth: password ? false : true,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password ,username} = req.body;
  console.log("🚀 ~ router.post ~ req.body:", req.body);

  try {
    const user = await UserModel.findOne({ email });

    // Google login
    if (email && !password) {
      if (user) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
        return res.status(200).json({ token });
      }
      const newUser = new UserModel({ username,email, googleAuth: true });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.status(200).json({ token });
    }

    // Login with email and password
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.googleAuth) {
      return res.status(400).json({ error: "Use Google login" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token });
  } catch (error) {
    console.error("🚀 ~ router.post ~ error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/protected", Authentication, async (req, res) => {
  try {
    // Use the user ID from the request object (set by the middleware)
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "This is a protected route", user });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's quiz results
router.get("/user/results", Authentication, async (req, res) => {
  const userId = req.user.id;
  try {
    const results = await Response.find({ user: userId })
      .populate("quiz", "title")
      .populate("answers.question");
    res.status(200).send(results);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving results", error });
  }
});

router.get("/quiz/:id/questions", async (req, res) => {
  const { id } = req.params;
  res.set("Cache-Control", "no-store");
  try {
    const quiz = await Quiz.findById(id).populate("questions");
    if (!quiz) {
      return res.status(404).send({ message: "Quiz not found" });
    }

    res.status(200).send(quiz.questions);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving questions", error });
  }
});

// Submit Quiz
router.post("/submit-quiz", Authentication, async (req, res) => {
  const { quizId, answers } = req.body;
  const userId = req.user.id;
  try {
    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) return res.status(404).send({ message: "Quiz not found" });

    let score = 0;

    for (let answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (question) {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        if (
          correctOption &&
          question.options[answer.selectedOption].text === correctOption.text
        ) {
          score += 1; // Assuming each question carries 1 mark
        }
      }
    }

    const response = new Response({
      user: userId,
      quiz: quizId,
      answers,
      score,
    });

    await response.save();
    res.status(201).send({ message: "Quiz submitted successfully", score });
  } catch (error) {
    res.status(500).send({ message: "Error submitting quiz", error });
  }
});

module.exports = router;
