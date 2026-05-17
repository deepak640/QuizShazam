const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  quizTimerSeconds: { type: Number, default: 10 },
  defaultTimerMinutes: { type: Number, default: 5 },
  allowPreviousQuestion: { type: Boolean, default: false },
  proctoring: {
    enabled:                    { type: Boolean, default: false },
    detectTabSwitch:            { type: Boolean, default: true },
    fullscreenRequired:         { type: Boolean, default: true },
    detectFullscreenExit:       { type: Boolean, default: true },
    blockCopyPaste:             { type: Boolean, default: true },
    disableRightClick:          { type: Boolean, default: true },
    maxViolations:              { type: Number,  default: 3, min: 1 },
    autoSubmitOnViolationLimit: { type: Boolean, default: true },
  },
});

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
