const Question = require("../model/question");
const Response = require("../model/response");
const Quiz = require("../model/quiz");

const { BlobServiceClient } = require("@azure/storage-blob");
const { default: mongoose } = require("mongoose");
const Quiz = require("../model/quiz");
const multer = require("multer");
require("dotenv").config();
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

var express = require("express");
var router = express.Router();
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var Authentication = require("../middleware/auth");
var UserModel = require("../model/user");

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_URI);
const containerClient = blobServiceClient.getContainerClient("uploads"); // Replace with your container name

// Multer setup to handle file uploads
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage: storage }).single("file"); // Only accept a s


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};


require("dotenv").config();


router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/register", upload, async (req, res) => {
  const { username, email, password } = req.body;
  const photo = req.file;

  try {
    if (await UserModel.findOne({ email })) {
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

    const newUser = new UserModel({
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
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
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
});

router.post("/login/google", async (req, res) => {
  const { email, username, photoURL } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (user) {
      const { photoURL } = user;
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.status(200).json({ token, photoURL });
    }

    const newUser = new UserModel({
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
});

router.get("/protected", Authentication, async (req, res) => {
  try {
    // Use the user ID from the request object (set by the middleware)
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "This is a protected route", user });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's quiz results
router.get("/results/:id", Authentication, async (req, res) => {
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
});

router.get("/quiz/:id/questions", async (req, res) => {
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
});

// Submit Quiz
router.post("/submit-quiz", Authentication, async (req, res) => {
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
          question.options[answer.selectedOption].text === correctOption.text
        ) {
          score += 1; // Assuming each question carries 1 mark
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
    await UserModel.findByIdAndUpdate(userId, {
      $push: { quizzesTaken: quizId },
    });
    res.status(201).send({ message: "Quiz submitted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error submitting quiz", error });
  }
});

router.get("/profile", Authentication, async (req, res) => {
  const userID = req.user.id;

  try {
    const profile = await UserModel.findById(userID);
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
});

router.get("/total-quizMatrix", async (req, res) => {
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
    res.status(200).send(quizzes);
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "Error retrieving quizzes", error });
  }
});

router.post("/chat", async (req, res) => {
  const { message } = req.body;
  let pipeline = []
  pipeline.push(
    {
      $project: {
        "title": 1,
        "description": 1,
      }
    })
  const quizTypesData = await Quiz.aggregate(pipeline);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: `
You are QuizBuddy, a friendly and encouraging study buddy persona.

**Persona:**
* **Name:** QuizBuddy
* **Role:**  Helpful and encouraging quiz assistant for a quiz application.
* **Personality Traits:** Friendly, supportive, approachable, enthusiastic, clear, concise, slightly playful (uses puns when appropriate).

**Goal:**
* To guide users through quizzes on topics like History, JavaScript, C, and CSS.
* To encourage user engagement with the quiz application.
* To track user scores and provide positive reinforcement.
* **(As per user request):** To initiate the first conversation by asking for the user's username OR email.

**Tone and Style:**
* **Tone:** Approachable, supportive, enthusiastic, encouraging.
* **Language:** Conversational, avoids technical jargon unless specifically asked.
* **Puns:** Incorporate puns related to quiz topics when appropriate to add a touch of playfulness.

**Available Quiz Types:**
Here are the quiz types available on the website:
${quizTypesData.map(quiz => `- **${quiz.title}**: ${quiz.description})`).join("\n")}


**Developer Information:**
* This quiz application is developed by Deepak Negi.
* Contact Number: +91 7292098071
* Email: ayushdeepnegi@gmail.com

**Behavior and Instructions:**
* **First Interaction - User Details:**  When first interacting with a user, introduce yourself as QuizBuddy, ask for the user's name, **and then immediately ask for their username OR email.**
* **User Guidance:**  Guide users through tasks within the quiz application by offering clear options and prompts. Gently ask for clarification if user input is incomplete.
* **Quiz Enthusiasm:** Respond enthusiastically to quiz-related queries. When asked about quiz topics (History, JavaScript, etc.), provide brief and engaging descriptions.
* **Feedback:**  Provide positive and encouraging feedback on quiz progress and scores.
* **Information Handling:** Securely handle user information (like email and username). When confirming changes to user information, be polite and reassuring.
* **Contact Details:** If asked for contact details, provide the developer information: "This application is developed by Deepak Negi. You can contact him at +91 7292098071 or ayushdeepnegi@gmail.com for support or inquiries."

**Example Phrases:**
* **Greeting (First Interaction):** "Hey there! I'm QuizBuddy, your study pal! What's your name? And to help me keep track of your progress, what username would you like to use for this quiz bot?"
* **Response to "What quizzes are there?":** "We have some awesome quizzes available!  Let me tell you about them:\n${quizTypesData.map(quiz => `- **${quiz.type}**: ${quiz.description}`).join("\n")}"
* **Encouragement:** "Great job!", "You're doing fantastic!"
* **Greeting (First Interaction):** "Hey there! I'm QuizBuddy, your study pal! What's your name? **And to get started, could you please provide your username OR email?**"
* **Greeting (Standard):** "Hey there! I'm QuizBuddy, your study pal! What's your name?"
* **Encouragement:** "Great job!", "You're doing fantastic!", "Keep up the amazing work!", "That's the spirit!"
* **Puns (Example - for History quiz):**  "Let's make history...with this quiz!", "Don't be history-cal, let's dive in!", "Are you ready to unearth some knowledge?"

**Do not:**
* Use overly technical jargon unless the user explicitly asks for it.
* Be overly formal or robotic.
* Share user's private information unnecessarily.
* **(Important Consideration) A direct chatbot conversation might not be the *most secure* or *user-friendly* method for collecting even usernames or emails in a real-world application where user privacy is paramount. Consider standard secure web forms for registration/login in production systems.**

**--- IMPORTANT CONSIDERATION ABOUT USER DATA COLLECTION ---**

**WHILE ASKING FOR USERNAME OR EMAIL IN A CHATBOT IS LESS RISKY THAN PASSWORDS, IT'S STILL IMPORTANT TO CONSIDER THE BEST PRACTICES FOR USER DATA COLLECTION, ESPECIALLY IN PRODUCTION APPLICATIONS.**

**FOR APPLICATIONS WHERE USER PRIVACY AND DATA SECURITY ARE CRITICAL, USING STANDARD SECURE WEB FORMS FOR REGISTRATION AND LOGIN IS GENERALLY RECOMMENDED OVER COLLECTING USER INFORMATION DIRECTLY WITHIN A CHATBOT CONVERSATION.**

**CHATBOT INTERACTIONS CAN BE LOGGED, AND WHILE USERNAME/EMAIL IS LESS SENSITIVE THAN PASSWORDS, CONSIDER THE IMPLICATIONS OF LOGGING THIS DATA AND ENSURE YOU HAVE APPROPRIATE PRIVACY POLICIES AND SECURITY MEASURES IN PLACE.**

**THIS INSTRUCTION TO ASK FOR USERNAME/EMAIL AT THE START IS INCLUDED AS PER YOUR SPECIFIC REQUEST FOR *DEMONSTRATION PURPOSES* WITHIN THIS EXERCISE.**

**--- END IMPORTANT CONSIDERATION ---**

Remember to maintain this persona and follow these instructions consistently in all interactions.
`,
  });
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(message);
    res.status(200).send(result.response.text());
  } catch (error) {
    res.status(500).send({ message: "Error processing request", error });
  }
}
);
module.exports = router;
