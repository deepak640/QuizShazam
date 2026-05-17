const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const proctorLogSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  quizId:    { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
  sessionId: { type: Schema.Types.ObjectId, ref: "QuizSession", index: true },
  eventType: {
    type: String,
    enum: ["TAB_SWITCH", "FULLSCREEN_EXIT", "COPY_ATTEMPT", "PASTE_ATTEMPT", "CUT_ATTEMPT", "RIGHT_CLICK", "WINDOW_BLUR", "AUTO_SUBMIT"],
    required: true,
  },
  metadata:  { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, index: true },
});

proctorLogSchema.index({ userId: 1, quizId: 1 });
proctorLogSchema.index({ quizId: 1, createdAt: -1 });

const ProctorLog = mongoose.model("ProctorLog", proctorLogSchema);
module.exports = ProctorLog;
