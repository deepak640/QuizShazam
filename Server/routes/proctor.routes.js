const express = require("express");
const router = express.Router();
const Authentication = require("../middleware/auth");
const { logViolation, getSessionViolations, getAdminReport, getQuizProctoringConfig } = require("../controller/proctor.controller");

router.post("/log", Authentication, logViolation);
router.get("/session", Authentication, getSessionViolations);
router.get("/admin/report", Authentication, getAdminReport);
router.get("/config", getQuizProctoringConfig);

module.exports = router;
