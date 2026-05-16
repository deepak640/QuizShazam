const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const responseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  quiz: { type: Schema.Types.ObjectId, ref: "Quiz" },
  answers: [
    {
      questionId: { type: Schema.Types.ObjectId, ref: "Question" },
      selectedOption: Number,        // single-select (legacy + current)
      selectedOptions: [Number],     // multi-select: array of chosen indices
    },
  ],
  score: { type: Number },       // earned marks
  totalMarks: { type: Number },  // max possible marks for this quiz
  createdAt: { type: Date, default: Date.now },
});

const Response = mongoose.model("Response", responseSchema);
module.exports = Response
