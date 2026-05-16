const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  quizTimerSeconds: { type: Number, default: 10 },         // legacy, keep for compat
  defaultTimerMinutes: { type: Number, default: 5 },        // global default quiz timer
  allowPreviousQuestion: { type: Boolean, default: false }, // global default for nav
});

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
