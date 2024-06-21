var express = require('express');
var router = express.Router();
const Quiz = require("../model/quiz");
const Question = require("../model/question");
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/create-quiz", async (req, res) => {
  const { title, description, questions, authorId } = req.body;
  try {
    const quiz = new Quiz({ title, description, author: authorId });
    await quiz.save();

    for (let q of questions) {
      const question = new Question({
        questionText: q.questionText,
        options: q.options,
        quiz: quiz._id,
      });
      await question.save();
      quiz.questions.push(question);
    }

    await quiz.save();
    res.status(201).send({ message: "Quiz created successfully", quiz });
  } catch (error) {
    res.status(500).send({ message: "Error creating quiz", error });
  }
});

// Get all quizzes
router.get('/quizzes', async (req, res) => {
    try {
        const quizzes = await Quiz.find().populate('author', 'username');
        res.status(200).send(quizzes);
    } catch (error) {
        res.status(500).send({ message: 'Error retrieving quizzes', error });
    }
});

// Get quiz by ID
router.get('/quiz/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const quiz = await Quiz.findById(id).populate('questions');
        if (!quiz) return res.status(404).send({ message: 'Quiz not found' });

        res.status(200).send(quiz);
    } catch (error) {
        res.status(500).send({ message: 'Error retrieving quiz', error });
    }
});


module.exports = router;
