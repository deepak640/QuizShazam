const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");


const Authentication = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send({ error: "Invalid Token" });
    // Attach the user ID (converted back to ObjectId) to the request object
    req.user = { id: new mongoose.Types.ObjectId(user.id), role: user.role };
    // console.log("🚀 ~ jwt.verify ~ user:", req.user)
    next();
  });
};

// Attaches user if token present, but never blocks the request
const OptionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return next();
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: new mongoose.Types.ObjectId(user.id), role: user.role };
  } catch {
    // Invalid token — ignore, treat as guest
  }
  next();
};

module.exports = Authentication;
module.exports.OptionalAuth = OptionalAuth;
