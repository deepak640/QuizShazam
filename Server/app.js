var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var bodyparser = require("body-parser");
var cors = require("cors");
require("dotenv").config();
var app = express();
app.disable("etag");
// view engine setup
// app.use(cors({
//   origin: ['http://localhost:5173/', 'https://quiz-shazam.vercel.app/'],
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   allowedHeaders: 'Content-Type,Authorization',
//   credentials: true
// }));


app.use(cors({
  origin: true,
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true
}));

app.use(logger("dev"));
app.use(bodyparser.json({ limit: "50mb" }));
app.use(bodyparser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "50mb" }));
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
var port = process.env.PORT || "3000";
mongoose
  .connect(process.env.MONGO_URI, options)
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

app.use("/", indexRouter);
app.use("/users", usersRouter);

app.listen(port, () => {
  console.log("listening");
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
