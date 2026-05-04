const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String },
  email: { type: String },
  password: { type: String },
  photoURL: { type: String },
  bio: { type: String, default: "" },
  phone: { type: String, default: "" },
  role: { type: String },
  googleAuth: { type: Boolean },
  quizzesTaken: [{ type: Schema.Types.ObjectId, ref: "Quiz" }],
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
