const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const questionSchema = new Schema({
  questionText: { type: String, required: true },
  options: [{ text: String, isCorrect: Boolean }],
  quiz: { type: Schema.Types.ObjectId, ref: "Quiz" },
  createdAt: { type: Date, default: Date.now },
  explanation: { type: String, default: null },
  referenceLink: { type: String, default: null },
  topic: { type: String, default: null },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
  isMultiSelect: { type: Boolean, default: false },
  questionType: { type: String, enum: ["mcq", "multi", "true_false"], default: "mcq" },
  timerSeconds: { type: Number, default: null }, // null = use global timer
});

const Question = mongoose.model("Question", questionSchema);
module.exports = Question
