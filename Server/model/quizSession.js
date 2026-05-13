const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const savedAnswerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    selectedOption: { type: Number, default: null },
    selectedOptions: { type: [Number], default: [] },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const quizSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "expired"],
      default: "in_progress",
    },
    answers: [savedAnswerSchema],
    currentIndex: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Fast lookup by user + quiz; unique enforces one active attempt per user per quiz
quizSessionSchema.index({ userId: 1, quizId: 1 }, { unique: true });
quizSessionSchema.index({ status: 1, lastActiveAt: 1 });

module.exports = mongoose.model("QuizSession", quizSessionSchema);
