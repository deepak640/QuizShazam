var bcrypt = require("bcryptjs");
var User = require("../model/user");
const adminSeeder = async () => {
  try {
    const encryptedPassword = await bcrypt.hash("123456", 10);
    const adminExist = await User.findOne({ email: "admin@admin.com" }).exec();
    if (adminExist) {
      return "Admin already exists";
    }

    await new User({
      username: "Admin",
      email: "admin@admin.com",
      password: encryptedPassword,
      role: "admin",
    }).save();
  } catch (error) {
    console.error(error);
  }
};

module.exports = adminSeeder;
