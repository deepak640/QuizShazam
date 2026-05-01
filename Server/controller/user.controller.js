const Quiz = require("../model/quiz");
const User = require("../model/user");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var Question = require("../model/question");
var Response = require("../model/response");
const { BlobServiceClient } = require("@azure/storage-blob");
const { default: mongoose } = require("mongoose");

// Func
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_URI);
const containerClient = blobServiceClient.getContainerClient("uploads");


const HomeRoute = async (req, res, next) => {
  res.send("respond with a resource");
}

const register = async (req, res) => {
  const { username, email, password } = req.body;
  const photo = req.file;

  try {
    if (await User.findOne({ email })) {
      return res.status(401).json({ error: "User already exists" });
    }

    let uploadedPhotoURL = "";
    if (photo) {
      const blobName = `profile-${Date.now()}-${email}.jpg`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Upload the file to Azure Blob Storage
      await blockBlobClient.upload(photo.buffer, photo.size);

      uploadedPhotoURL = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerClient.containerName}/${blobName}`;

    }

    const newUser = new User({
      username,
      email,
      password: password && bcrypt.hashSync(password, 10),
      photoURL: password ? uploadedPhotoURL : photoURL,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Return JSON response instead of file rendering
    res.status(200).json({ token, photoURL: uploadedPhotoURL || "" });
  } catch (error) {
    console.log("🚀 ~ router.post ~ error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log(req.body)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    console.log(isMatch,"isMatch")
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }
    console.log("🚀 ~ router.post ~ user:", user);
    if (user.role) {
      console.log("🚀 ~ router.post ~ user.role:", user.role);
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.status(200).json({ token });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const { photoURL } = user;
    res.status(200).json({ token, photoURL });
  } catch (error) {
    console.error("🚀 ~ router.post ~ error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

const googleLogin = async (req, res) => {
  const { email, username, photoURL } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      const { photoURL } = user;
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.status(200).json({ token, photoURL });
    }

    const newUser = new User({
      username,
      email,
      photoURL,
      googleAuth: true,
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return res.status(200).json({ token, photoURL });
  } catch (error) {
    console.error("🚀 ~ router.post ~ error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

const userResult = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const results = await Response.findOne({ user: userId, quiz: id })
      .populate("quiz", "title")
      .populate("answers.questionId");
    res.status(200).send(results);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving results", error });
  }
}

const userQuestion = async (req, res) => {
  const { id } = req.params;
  res.set("Cache-Control", "no-store");
  try {
    const quiz = await Quiz.findById(id).populate("questions");
    if (!quiz) {
      return res.status(404).send({ message: "Quiz not found" });
    }

    res.status(200).send(quiz.questions);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving questions", error });
  }
}

const quizSubmission = async (req, res) => {
  const { quizId, answers } = req.body;
  const userId = req.user.id;
  try {
    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) return res.status(404).send({ message: "Quiz not found" });

    let score = 0;

    for (let answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (question) {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        if (
          correctOption &&
          answer.selectedOption !== null &&
          answer.selectedOption !== undefined &&
          question.options[answer.selectedOption]?.text === correctOption.text
        ) {
          score += 1;
        }
      }
    }
    const response = new Response({
      user: userId,
      quiz: quizId,
      answers,
      score,
    });
    await response.save();
    await User.findByIdAndUpdate(userId, {
      $push: { quizzesTaken: quizId },
    });
    res.status(201).send({ message: "Quiz submitted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error submitting quiz", error });
  }
}

const userProfile = async (req, res) => {
  const userID = req.user.id;

  try {
    const profile = await User.findById(userID);
    console.log("🚀 ~ router.get ~ profile:", profile)
    let quizzes = [];
    for (let quiz of profile.quizzesTaken) {
      let info = await Quiz.findById(quiz._id);
      quizzes.push(info);
    }
    res.json({ profile, quizzes });
  } catch (error) {
    res.status(500).send({ message: "Comeback later", error });
  }
}

const quizMatrix = async (req, res) => {
  try {
    let pipeline = []
    let matchObj = {}
    if (req.query.userid) {
      matchObj.user = new mongoose.Types.ObjectId(req.query.userid)
    }
    if (req.query.quizid) {
      matchObj.quiz = new mongoose.Types.ObjectId(req.query.quizid)
    }
    if (req.query.startdate) {
      matchObj.createdAt = { $gte: new Date(req.query.startdate) }
    }
    pipeline.push(
      {
        $match: matchObj
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz",
          foreignField: "_id",
          as: "quizObj"
        }
      },
      {
        $unwind: "$quizObj"
      },
      {
        $addFields: {
          "title": "$quizObj.title"
        }
      },
      {
        $project: {
          "score": 1,
          "title": 1
        }
      }
    )

    const quizzes = await Response.aggregate(pipeline);
    console.log(quizzes)
    res.status(200).send(quizzes);
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "Error retrieving quizzes", error });
  }
}

const aiChat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;

    if (!message) {
      return res.status(400).send("Message is required");
    }

    const lowerMsg = message.toLowerCase();

    // Fetch user info for personalization
    let userName = "there";
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        userName = user.username || "User";
      }
    }

    // 1. Fetch available quizzes for dynamic info
    const quizzes = await Quiz.find({}, "title description questions");
    const quizList = quizzes.map(q => `- **${q.title}**: ${q.description} (Contains **${q.questions.length}** questions)`).join("\n");

    // Check if user is asking about a specific quiz
    for (const quiz of quizzes) {
      if (lowerMsg.includes(quiz.title.toLowerCase()) && lowerMsg.length < 50) {
        return res.status(200).send(`**${quiz.title}** is a great choice! 🎯\n\n**About:** ${quiz.description}\n**Questions:** It has ${quiz.questions.length} challenging questions to test your knowledge.\n\nReady to start? You can find it on the dashboard!`);
      }
    }

    // 2. Rule-based Logic
    // Greetings (English, Hinglish, Hindi)
    if (lowerMsg.match(/\b(hi|hello|hey|greetings|hola|namaste|kaise ho|kya haal hai|नमस्ते|कैसे हो)\b/)) {
      return res.status(200).send(`Hey ${userName}! I'm QuizBuddy, your study pal! 🎓 How can I help you today?\n\nTry asking me:\n- "What is my score?" (Mera score kya hai?)\n- "Who am I?" (Main kaun hoon?)\n- "Available quizzes" (Kaunse quizzes hain?)`);
    }

    // Score Retrieval (English, Hinglish, Hindi)
    if (
      lowerMsg.includes("score") || lowerMsg.includes("result") || lowerMsg.includes("performance") || 
      lowerMsg.includes("marks") || lowerMsg.includes("how did i do") || 
      lowerMsg.includes("mera score") || lowerMsg.includes("kitne marks") || lowerMsg.includes("result dikhao") ||
      lowerMsg.includes("नतीजा") || lowerMsg.includes("परिणाम") || lowerMsg.includes("मेरा स्कोर")
    ) {
      if (!userId) {
        return res.status(200).send("I'd love to help you with your scores, but I couldn't identify you. Please make sure you're logged in!");
      }

      const userResponses = await Response.find({ user: userId }).populate("quiz", "title");
      
      if (userResponses.length === 0) {
        return res.status(200).send(`Hey ${userName}, it looks like you haven't taken any quizzes yet! ✍️ Once you complete a quiz, I'll be able to show your scores here.`);
      }

      let responseText = `Here are your quiz scores so far, ${userName}: 📊\n\n`;
      userResponses.forEach((res, index) => {
        const quizTitle = res.quiz ? res.quiz.title : "Unknown Quiz";
        const score = res.score !== undefined ? res.score : 0;
        const date = new Date(res.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        responseText += `${index + 1}. **${quizTitle}** (${date}): ${score} points\n`;
      });
      responseText += `\nKeep up the great work! Is there anything else you'd like to know?`;
      
      return res.status(200).send(responseText);
    }

    // User Info / Personal Data (English, Hinglish, Hindi)
    if (
      lowerMsg.includes("who am i") || lowerMsg.includes("my name") || lowerMsg.includes("about me") ||
      lowerMsg.includes("main kaun hoon") || lowerMsg.includes("kaun hoon main") || lowerMsg.includes("mera naam") ||
      lowerMsg.includes("मैं कौन हूँ") || lowerMsg.includes("मेरा नाम")
    ) {
      if (!userId) {
        return res.status(200).send("I'm not sure who you are yet! Please log in so I can get to know you.");
      }
      const user = await User.findById(userId);
      return res.status(200).send(`You are **${user.username}**! Your email is ${user.email}. You've taken ${user.quizzesTaken.length} quizzes so far. 🌟`);
    }

    // Quiz Information (English, Hinglish, Hindi)
    if (
      lowerMsg.includes("quiz") || lowerMsg.includes("test") || lowerMsg.includes("list") || lowerMsg.includes("available") ||
      lowerMsg.includes("kaunse quiz") || lowerMsg.includes("quiz dikhao") ||
      lowerMsg.includes("कौनसे क्विज़") || lowerMsg.includes("क्विज़ लिस्ट")
    ) {
      if (quizzes.length === 0) {
        return res.status(200).send("We don't have any quizzes available right now, but check back soon!");
      }
      return res.status(200).send(`We have some awesome quizzes available! 🚀 Here they are:\n\n${quizList}\n\nWhich one would you like to try?`);
    }

    // Developer / Contact Information
    if (lowerMsg.includes("developer") || lowerMsg.includes("contact") || lowerMsg.includes("deepak") || lowerMsg.includes("support") || lowerMsg.includes("who built")) {
      return res.status(200).send("This application is developed by **Deepak Negi**. 👨‍💻\n\n📞 **Contact:** +91 7292098071\n📧 **Email:** ayushdeepnegi@gmail.com\n\nFeel free to reach out for support or inquiries!");
    }

    // Specific Subjects (Hardcoded knowledge)
    if (lowerMsg.includes("javascript") || lowerMsg.includes("js")) {
      return res.status(200).send("JavaScript is the language of the web! 🌐 Our JS quizzes cover everything from basics to advanced ES6+ features. Want to see the quiz list?");
    }
    
    if (lowerMsg.includes("history")) {
      return res.status(200).send("Ready to unearth some knowledge? 🏛️ Our History quizzes will take you through time. Check out the available quizzes to start!");
    }

    // Fallback
    return res.status(200).send("I'm not quite sure I understood that. 🤔\n\nTry asking me:\n- 'What is my score?'\n- 'What quizzes are available?'\n- 'Who is the developer?'\n- 'Hi' to say hello!");

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).send("Oops! Something went wrong on my end. Please try again later.");
  }
};


module.exports = {
  HomeRoute,
  register,
  login,
  quizSubmission,
  userProfile,
  quizMatrix,
  aiChat,
  userResult,
  userQuestion,
  googleLogin
}
