var express = require("express");
var router = express.Router();
const Quiz = require("../model/quiz");
const Question = require("../model/question");
const userModel = require("../model/user");
const Authentication = require("../middleware/auth");
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

module.exports = router;
