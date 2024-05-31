const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");


const Authentication = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    // Attach the user ID (converted back to ObjectId) to the request object
    req.user = { id: new mongoose.Types.ObjectId(user.id) };
    console.log("🚀 ~ jwt.verify ~ user:", req.user)
    next();
  });
};

module.exports = Authentication;
