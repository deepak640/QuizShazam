const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  quizTimerSeconds: { type: Number, default: 10 },
});

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
