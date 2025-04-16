const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const quizSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  author: { type: String },
  createdAt: { type: Date, default: Date.now },

  // New fields
  expiresAt: { type: Date, required: true }, // For TTL auto-delete
});

// TTL index: this tells MongoDB to delete when expiresAt is reached
quizSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
