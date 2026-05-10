var bcrypt = require("bcryptjs");
var User = require("../model/user");
const adminSeeder = async () => {
  try {
    const encryptedPassword = await bcrypt.hash("QuizShazam@2026", 10);
    const adminExist = await User.findOne({ email: "admin@quizshazam.com" }).exec();
    if (adminExist) {
      return "Admin already exists";
    }

    await new User({
      username: "Admin",
      email: "admin@quizshazam.com",
      password: encryptedPassword,
      role: "admin",
    }).save();
  } catch (error) {
    console.error(error);
  }
};

module.exports = adminSeeder;
