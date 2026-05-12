var multer = require("multer");
var express = require("express");
var router = express.Router();
var Authentication = require("../middleware/auth");

require("dotenv").config();

const {
  HomeRoute, register, login, googleLogin, userResult, quizSubmission,
  userProfile, quizMatrix, aiChat, userQuestion,
  updateProfile, setup2FA, enable2FA, disable2FA, validate2FALogin,
  getUserHistory,
} = require("../controller/user.controller");

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");
const uploadPhoto = multer({ storage }).single("photo");

router.get("/", HomeRoute);
router.post("/register", upload, register);
router.post("/login", login);
router.post("/login/google", googleLogin);
router.post("/2fa/validate", validate2FALogin);

router.get("/results/:id", Authentication, userResult);
router.get("/quiz/:id/questions", userQuestion);
router.post("/submit-quiz", Authentication, quizSubmission);
router.get("/profile", Authentication, userProfile);
router.put("/profile", Authentication, uploadPhoto, updateProfile);
router.get("/total-quizMatrix", Authentication, quizMatrix);
router.post("/chat", Authentication, aiChat);

// Admin: view any user's quiz history
router.get("/history/:userId", Authentication, getUserHistory);

// 2FA routes
router.post("/2fa/setup", Authentication, setup2FA);
router.post("/2fa/enable", Authentication, enable2FA);
router.post("/2fa/disable", Authentication, disable2FA);

module.exports = router;
