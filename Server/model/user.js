const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String },
  email: { type: String },
  password: { type: String },
  photoURL: { type: String },
  role: { type: String },
  googleAuth: { type: Boolean },
  quizzesTaken: [{ type: Schema.Types.ObjectId, ref: "Quiz" }],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
