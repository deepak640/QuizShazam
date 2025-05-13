var multer = require("multer");
var express = require("express");
var router = express.Router();
var Authentication = require("../middleware/auth");

require("dotenv").config();

const { HomeRoute, register, login, googleLogin, userResult, quizSubmission, userProfile, quizMatrix, aiChat, userQuestion } = require("../controller/user.controller");


// Multer setup to handle file uploads
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage: storage }).single("file"); // Only accept a s




router.get("/", HomeRoute);

router.post("/register", upload, register);

router.post("/login", login);

router.post("/login/google", googleLogin);


// Get user's quiz results
router.get("/results/:id", Authentication, userResult);

router.get("/quiz/:id/questions", userQuestion);

// Submit Quiz
router.post("/submit-quiz", Authentication, quizSubmission);

router.get("/profile", Authentication, userProfile);

router.get("/total-quizMatrix", Authentication, quizMatrix);

router.post("/chat", aiChat);


module.exports = router;
