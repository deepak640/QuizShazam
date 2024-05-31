const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const responseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  quiz: { type: Schema.Types.ObjectId, ref: "Quiz" },
  answers: [
    {
      question: { type: Schema.Types.ObjectId, ref: "Question" },
      selectedOption: Number, // Index of the selected option
    },
  ],
  score: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

const Response = mongoose.model("Response", responseSchema);
module.exports = Response
