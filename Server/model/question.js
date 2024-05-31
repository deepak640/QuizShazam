const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const questionSchema = new Schema({
  questionText: { type: String, required: true },
  options: [{ text: String, isCorrect: Boolean }],
  quiz: { type: Schema.Types.ObjectId, ref: "Quiz" },
  createdAt: { type: Date, default: Date.now },
});

const Question = mongoose.model("Question", questionSchema);
module.exports = Question
