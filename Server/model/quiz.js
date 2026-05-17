const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const quizSchema = new Schema({
  title: { type: String, required: true },
  subject: { type: String, default: null },  // group name, e.g. "MongoDB"
  description: { type: String },
  questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  author: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  timerMinutes: { type: Number, default: 5, min: 1 },
  allowPreviousQuestion: { type: Boolean, default: false },
  passingPercentage: { type: Number, default: 70, min: 1, max: 100 },
  proctoring: {
    enabled:                    { type: Boolean, default: false },
    detectTabSwitch:            { type: Boolean, default: true },
    fullscreenRequired:         { type: Boolean, default: true },
    detectFullscreenExit:       { type: Boolean, default: true },
    blockCopyPaste:             { type: Boolean, default: true },
    disableRightClick:          { type: Boolean, default: true },
    maxViolations:              { type: Number,  default: 3, min: 1 },
    autoSubmitOnViolationLimit: { type: Boolean, default: true },
  },
});

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
