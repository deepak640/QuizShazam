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
});

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
