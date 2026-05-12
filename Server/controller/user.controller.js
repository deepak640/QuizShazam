const Quiz = require("../model/quiz");
const User = require("../model/user");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var Question = require("../model/question");
var Response = require("../model/response");
const { default: mongoose } = require("mongoose");
const cloudinary = require("cloudinary").v2;
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


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
      const b64 = `data:${photo.mimetype};base64,${photo.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(b64, {
        folder: "quizshazam/profiles",
        public_id: `profile-${Date.now()}`,
        resource_type: "image",
      });
      uploadedPhotoURL = result.secure_url;
    }

    const newUser = new User({
      username,
      email,
      password: password && bcrypt.hashSync(password, 10),
      photoURL: uploadedPhotoURL,
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
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    // If 2FA is enabled, return a short-lived temp token instead of a full session
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ id: user._id, twoFactorPending: true }, process.env.JWT_SECRET, { expiresIn: "5m" });
      return res.status(200).json({ requiresTwoFactor: true, tempToken });
    }

    if (user.role) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).json({ token });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token, photoURL: user.photoURL });
  } catch (error) {
    console.error("Login error:", error);
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
    if (!quiz) return res.status(404).send({ message: "Quiz not found" });

    const isSession = !!quiz.expiresAt;
    const sessionExpired = isSession && quiz.expiresAt < new Date();

    // Shuffle questions for fairness
    const questions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      isMultiSelect: q.isMultiSelect,
      questionType: q.questionType || (q.isMultiSelect ? "multi" : "mcq"),
      timerSeconds: q.timerSeconds ?? null,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    res.status(200).send({
      questions,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        isSession,
        expiresAt: quiz.expiresAt || null,
        sessionExpired,
      },
    });
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
    if (quiz.expiresAt && quiz.expiresAt < new Date()) {
      return res.status(403).send({ message: "Session has expired. Submission not accepted." });
    }

    let score = 0;

    for (let answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (!question) continue;

      if (question.isMultiSelect) {
        const correctIndices = question.options
          .map((opt, i) => (opt.isCorrect ? i : -1))
          .filter((i) => i !== -1);
        const selected = Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [];
        const allCorrectSelected = correctIndices.every((i) => selected.includes(i));
        const noWrongSelected = selected.every((i) => correctIndices.includes(i));
        if (correctIndices.length > 0 && allCorrectSelected && noWrongSelected) {
          score += 1;
        }
      } else {
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
    const profile = await User.findById(userID).lean();
    const quizzes = [];
    const normalQuizzesTakenIds = [];
    
    for (const quizId of profile.quizzesTaken) {
      const info = await Quiz.findById(quizId);
      // Only show normal quizzes (those without an expiry/session time)
      if (info && !info.expiresAt) {
        quizzes.push(info);
        normalQuizzesTakenIds.push(quizId);
      }
    }
    
    // Update the profile object in response to only count normal quizzes
    profile.quizzesTaken = normalQuizzesTakenIds;
    
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
        $match: {
          "quizObj.expiresAt": { $exists: false } // Exclude assessments
        }
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

    const msg = message.toLowerCase().trim();

    // ── Fetch live data ───────────────────────────────────────────────────
    const [quizzes, userDoc, userResponsesRaw] = await Promise.all([
      Quiz.find({ expiresAt: { $exists: false } }, "title description questions").lean(), // Only normal quizzes
      userId ? User.findById(userId).lean() : null,
      userId ? Response.find({ user: userId }).populate("quiz", "title questions expiresAt").lean() : [],
    ]);

    // Filter out assessments from user history
    const userResponses = userResponsesRaw.filter(r => r.quiz && !r.quiz.expiresAt);

    const userName  = userDoc?.username ?? "there";
    // Count only normal quizzes taken
    const quizCount = userResponses.length;

    // ── Helpers ───────────────────────────────────────────────────────────
    const match = (...terms) => terms.some(t => msg.includes(t));

    const quizList = quizzes.length
      ? quizzes.map((q, i) =>
          `**${i + 1}. ${q.title}** — ${q.description || "No description"} *(${q.questions.length} questions)*`
        ).join("\n")
      : "No quizzes available right now. Check back soon!";

    // Best score from history
    const bestEntry = userResponses.reduce((best, r) => {
      const total = r.quiz?.questions?.length || 1;
      const pct = (r.score / total) * 100;
      return pct > (best?.pct ?? -1) ? { ...r, pct } : best;
    }, null);

    // Recommend a quiz the user hasn't taken yet
    const takenIds = (userDoc?.quizzesTaken ?? []).map(id => id.toString());
    const untried = quizzes.find(q => !takenIds.includes(q._id.toString()));

    // ── 1. Greetings ──────────────────────────────────────────────────────
    if (match("hi", "hello", "hey", "hola", "namaste", "yo ", "sup", "kaise ho", "kya haal", "नमस्ते", "kya chal")) {
      const greets = [
        `Hey ${userName}! 👋 I'm **QuizBuddy**, your study companion on QuizShazam. Ask me about your scores, quiz topics, or what to study next!`,
        `Hello ${userName}! 😊 Ready to ace some quizzes today? I can show your scores, explain topics, or recommend your next challenge.`,
        `Namaste ${userName}! 🙏 QuizBuddy here — your personal guide on QuizShazam. What do you need help with today?`,
      ];
      return res.status(200).send(greets[Math.floor(Date.now() / 1000) % greets.length]);
    }

    // ── 2. Score / Results ────────────────────────────────────────────────
    if (match("score", "result", "marks", "performance", "how did i do", "kitne", "mera result", "mera score", "नतीजा", "परिणाम", "मेरा स्कोर")) {
      if (!userId) return res.status(200).send("Please **log in** first so I can pull up your quiz scores. 🔐");
      if (userResponses.length === 0) {
        return res.status(200).send(`Hey ${userName}, you haven't taken any quizzes yet! 📝\nHead to the **Dashboard** and pick one — your scores will show up here once you're done.`);
      }
      let out = `Here are your quiz results, **${userName}**: 📊\n\n`;
      userResponses.forEach((r, i) => {
        const title = r.quiz?.title ?? "Unknown Quiz";
        const total = r.quiz?.questions?.length ?? "?";
        const pct   = total !== "?" ? Math.round((r.score / total) * 100) : "—";
        const date  = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const bar   = total !== "?" ? "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10)) : "";
        out += `**${i + 1}. ${title}** *(${date})*\n   Score: **${r.score}/${total}** (${pct}%) ${bar}\n\n`;
      });
      if (bestEntry) {
        out += `🏆 Your best so far: **${bestEntry.quiz?.title}** with **${Math.round(bestEntry.pct)}%**. Keep it up!`;
      }
      return res.status(200).send(out);
    }

    // ── 3. Who am I / Profile ─────────────────────────────────────────────
    if (match("who am i", "my name", "about me", "my profile", "main kaun", "mera naam", "मैं कौन", "मेरा नाम")) {
      if (!userId) return res.status(200).send("You're not logged in yet! Please sign in so I can recognise you. 🔐");
      const email = userDoc?.email ?? "—";
      return res.status(200).send(
        `You are **${userName}** 🌟\n📧 Email: ${email}\n🎯 Quizzes taken: **${quizCount}**\n\n${
          quizCount === 0
            ? "You haven't taken any quizzes yet — go explore the Dashboard!"
            : bestEntry
            ? `Your best score is in **${bestEntry.quiz?.title}** — impressive! 🔥`
            : "Great to have you here!"
        }`
      );
    }

    // ── 4. Quiz list ──────────────────────────────────────────────────────
    if (match("quiz", "test", "available", "list", "kaunse", "show quiz", "quiz dikhao", "क्विज़", "कौनसे")) {
      const rec = untried ? `\n\n👉 I'd recommend trying **${untried.title}** next!` : "";
      return res.status(200).send(`Here are all the quizzes available on QuizShazam right now 🚀\n\n${quizList}${rec}`);
    }

    // ── 5. Recommendation ─────────────────────────────────────────────────
    if (match("recommend", "suggest", "what should i", "next quiz", "kya karun", "kya lu")) {
      if (!untried) {
        return res.status(200).send(`Wow ${userName}, you've taken all available quizzes! 🎉 Try retaking your lowest scorer to improve your percentage.`);
      }
      return res.status(200).send(`Based on your history, I recommend trying **${untried.title}** next! 🎯\n${untried.description || ""}\nIt has **${untried.questions.length} questions** — you've got this!`);
    }

    // ── 6. How to use the platform ────────────────────────────────────────
    if (match("how to", "how do i", "kaise", "submit", "start quiz", "take quiz", "upload", "kaise karu")) {
      return res.status(200).send(
        `Here's how QuizShazam works 👇\n\n` +
        `1. **Sign up / Log in** — use email or Google.\n` +
        `2. **Dashboard** — browse all available quizzes.\n` +
        `3. **Start a quiz** — a timer starts; questions auto-advance when time runs out.\n` +
        `4. **Submit** — your answers are scored instantly.\n` +
        `5. **Results** — see your score, correct answers, and review each question.\n` +
        `6. **Profile** — track all your past quiz scores in one place.\n\n` +
        `_(Admin/Educators can upload Excel quiz files from the Admin Panel.)_`
      );
    }

    // ── 7. Topic explanations ─────────────────────────────────────────────

    // JavaScript
    if (match("javascript", "js ", "es6", "ecmascript", "closure", "hoisting", "promise", "async await", "event loop")) {
      if (match("closure")) return res.status(200).send("A **closure** in JavaScript is a function that *remembers* variables from its outer scope even after that scope has finished executing.\n\n```js\nfunction counter() {\n  let count = 0;\n  return () => ++count;\n}\nconst inc = counter();\ninc(); // 1\ninc(); // 2\n```\nThe inner function keeps a reference to `count` — that's a closure! 🔒");
      if (match("hoisting")) return res.status(200).send("**Hoisting** means JavaScript moves `var` declarations and `function` declarations to the top of their scope at compile time.\n\n- `var` is hoisted but *not* initialised (value is `undefined`).\n- `let` / `const` are hoisted but sit in a **Temporal Dead Zone** until the line runs.\n- Function declarations are fully hoisted — you can call them before they're defined.");
      if (match("promise", "async", "await")) return res.status(200).send("**Promises** represent a future value. `.then()` chains success, `.catch()` handles errors.\n\n`async/await` is syntactic sugar:\n```js\nasync function fetchUser() {\n  const data = await fetch('/api/user');\n  return data.json();\n}\n```\nUnder the hood it's still a Promise — `await` just pauses execution inside the async function.");
      if (match("event loop")) return res.status(200).send("The **Event Loop** is what makes JavaScript non-blocking despite being single-threaded.\n\n1. **Call Stack** — runs synchronous code.\n2. **Web APIs** — handle timers, fetch, DOM events.\n3. **Callback / Microtask Queue** — queued callbacks wait here.\n4. **Event Loop** — moves tasks from the queue to the stack when it's empty.\n\nMicrotasks (Promises) run before macrotasks (setTimeout). 🔄");
      return res.status(200).send("**JavaScript** is the backbone of web development! 🌐\n\nKey topics in our JS quiz:\n- Variables: `var` / `let` / `const`, hoisting\n- Functions: closures, arrow functions, IIFE\n- Async: callbacks, Promises, async/await, Event Loop\n- ES6+: destructuring, spread/rest, modules\n- DOM manipulation & event handling\n\nWant a deep dive on any specific concept? Just ask!");
    }

    // React
    if (match("react", "jsx", "component", "hook", "usestate", "useeffect", "redux", "context api", "virtual dom")) {
      if (match("usestate")) return res.status(200).send("**useState** is a React Hook that adds state to a functional component.\n\n```jsx\nconst [count, setCount] = useState(0);\n```\n- `count` holds the current value.\n- `setCount(newVal)` triggers a re-render with the new value.\n- State updates are **asynchronous** — don't rely on the value immediately after calling the setter.");
      if (match("useeffect")) return res.status(200).send("**useEffect** runs side effects (API calls, subscriptions, timers) after render.\n\n```jsx\nuseEffect(() => {\n  fetchData(); // runs after every render\n}, [dependency]); // only re-runs when dependency changes\n```\nReturn a cleanup function to avoid memory leaks:\n```jsx\nuseEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);```");
      if (match("virtual dom")) return res.status(200).send("The **Virtual DOM** is a lightweight in-memory copy of the real DOM.\n\nWhen state changes:\n1. React creates a new Virtual DOM tree.\n2. It **diffs** the new tree against the previous one (reconciliation).\n3. Only the changed nodes are updated in the real DOM.\n\nThis makes React much faster than direct DOM manipulation. ⚡");
      return res.status(200).send("**React** is a UI library for building component-based interfaces. ⚛️\n\nKey concepts:\n- **JSX** — HTML-like syntax in JavaScript\n- **Components** — reusable UI building blocks (functional & class)\n- **Props** — data passed from parent to child\n- **State** — internal component data (`useState`)\n- **Hooks** — `useEffect`, `useContext`, `useRef`, custom hooks\n- **Virtual DOM** — efficient DOM diffing\n\nAsk me about any React concept!");
    }

    // Next.js
    if (match("next", "nextjs", "next.js", "app router", "ssr", "ssg", "server component", "getserversideprops", "api route")) {
      if (match("ssr", "server side")) return res.status(200).send("**SSR (Server-Side Rendering)** in Next.js renders the page HTML on the server *per request*.\n\n- In App Router: any component that uses `async/await` directly is a **Server Component** by default.\n- Use `'use client'` only when you need browser APIs or interactivity.\n- SSR is great for SEO and pages with frequently changing data.");
      if (match("ssg", "static")) return res.status(200).send("**SSG (Static Site Generation)** pre-renders pages at **build time** — no server needed at runtime.\n\nIn Next.js App Router, static generation is the default for pages with no dynamic data. Add `export const dynamic = 'force-static'` to be explicit. Perfect for blogs, docs, or marketing pages. ⚡");
      if (match("app router")) return res.status(200).send("Next.js **App Router** (Next 13+) uses a `app/` directory where:\n\n- Folders are routes, `page.tsx` is the UI.\n- `layout.tsx` wraps children (persistent UI like nav/footer).\n- **Server Components** by default — no client JS shipped unless `'use client'`.\n- `loading.tsx` → automatic Suspense; `error.tsx` → error boundaries.\n- Route Groups `(name)/` organise routes without affecting the URL.");
      return res.status(200).send("**Next.js** is a full-stack React framework by Vercel. 🚀\n\nKey features:\n- **App Router** — file-based routing with `app/` directory\n- **Server & Client Components** — choose where code runs\n- **SSR / SSG / ISR** — flexible rendering strategies\n- **API Routes** — backend endpoints inside the same project\n- **Image & Font optimisation** built-in\n- **Middleware** — edge functions for auth, redirects\n\nWhat aspect of Next.js do you want to explore?");
    }

    // DSA
    if (match("dsa", "data structure", "algorithm", "array", "linked list", "tree", "graph", "sorting", "binary search", "big o", "complexity", "recursion", "stack", "queue")) {
      if (match("big o", "complexity", "time complexity")) return res.status(200).send("**Big-O Notation** describes how an algorithm's time or space grows as input `n` grows.\n\nCommon complexities (best → worst):\n| Notation | Name | Example |\n|---|---|---|\n| O(1) | Constant | Array index lookup |\n| O(log n) | Logarithmic | Binary search |\n| O(n) | Linear | Linear search |\n| O(n log n) | Linearithmic | Merge sort |\n| O(n²) | Quadratic | Bubble sort |\n| O(2ⁿ) | Exponential | Recursive Fibonacci |");
      if (match("binary search")) return res.status(200).send("**Binary Search** finds a target in a *sorted* array in O(log n) time.\n\n```js\nfunction binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (arr[mid] === target) return mid;\n    arr[mid] < target ? (lo = mid + 1) : (hi = mid - 1);\n  }\n  return -1;\n}\n```\nKey idea: eliminate half the search space each iteration. 🔍");
      if (match("recursion")) return res.status(200).send("**Recursion** is when a function calls itself to solve a smaller version of the same problem.\n\nEvery recursive function needs:\n1. **Base case** — the stopping condition.\n2. **Recursive case** — makes the problem smaller.\n\n```js\nfunction factorial(n) {\n  if (n <= 1) return 1;        // base case\n  return n * factorial(n - 1); // recursive case\n}\n```\nWatch out for **stack overflow** if the base case is missing! ⚠️");
      return res.status(200).send("**DSA (Data Structures & Algorithms)** is core to tech interviews. 💡\n\nTopics covered in our DSA quiz:\n- **Arrays & Strings** — two pointers, sliding window\n- **Linked Lists** — singly, doubly, cycle detection\n- **Stacks & Queues** — monotonic stack, BFS\n- **Trees** — BST, traversals (inorder/preorder/postorder), height\n- **Graphs** — DFS, BFS, shortest path (Dijkstra)\n- **Sorting** — merge sort, quick sort, counting sort\n- **Dynamic Programming** — memoisation, tabulation\n\nAsk about any specific topic!");
    }

    // MongoDB
    if (match("mongodb", "mongoose", "nosql", "aggregation", "schema", "document", "collection", "pipeline")) {
      if (match("aggregation", "pipeline")) return res.status(200).send("MongoDB **Aggregation Pipeline** transforms documents through a series of stages:\n\n```js\ndb.orders.aggregate([\n  { $match: { status: 'active' } },   // filter\n  { $group: { _id: '$userId', total: { $sum: '$amount' } } }, // group\n  { $sort: { total: -1 } },            // sort\n  { $limit: 5 }                        // top 5\n]);\n```\nCommon stages: `$match`, `$group`, `$sort`, `$project`, `$lookup`, `$unwind`. 🔗");
      if (match("schema", "mongoose")) return res.status(200).send("**Mongoose** is an ODM (Object Document Mapper) for MongoDB in Node.js.\n\n```js\nconst userSchema = new mongoose.Schema({\n  name:  { type: String, required: true },\n  email: { type: String, unique: true },\n  role:  { type: String, enum: ['user','admin'], default: 'user' },\n}, { timestamps: true });\n\nmodule.exports = mongoose.model('User', userSchema);\n```\nSchemas add structure and validation on top of MongoDB's flexible documents.");
      return res.status(200).send("**MongoDB** is a document-oriented NoSQL database. 🍃\n\nKey concepts:\n- **Collections** → tables; **Documents** → rows (stored as BSON/JSON)\n- **Schema-less** — documents in the same collection can have different fields\n- **Aggregation Pipeline** — powerful data transformation & analytics\n- **Indexes** — critical for query performance\n- **Transactions** — ACID-compliant multi-document transactions (v4+)\n- **Atlas** — managed cloud MongoDB\n\nAsk me about aggregations, indexing, or Mongoose!");
    }

    // SQL / PostgreSQL
    if (match("sql", "postgres", "postgresql", "mysql", "relational", "join", "index", "transaction", "query")) {
      if (match("join")) return res.status(200).send("SQL **JOINs** combine rows from two or more tables:\n\n| Type | Returns |\n|---|---|\n| `INNER JOIN` | Only matching rows in both tables |\n| `LEFT JOIN` | All rows from left + matches from right |\n| `RIGHT JOIN` | All rows from right + matches from left |\n| `FULL OUTER JOIN` | All rows from both tables |\n\n```sql\nSELECT u.name, o.total\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id;\n```");
      if (match("index")) return res.status(200).send("A database **Index** is a data structure that speeds up `SELECT` queries at the cost of slower writes and more storage.\n\n```sql\nCREATE INDEX idx_users_email ON users(email);\n```\n- Use indexes on columns you frequently filter (`WHERE`) or sort (`ORDER BY`).\n- **Composite index**: `(col1, col2)` — order matters! Left-prefix rule applies.\n- Too many indexes slow down `INSERT/UPDATE/DELETE`. Balance is key. ⚖️");
      if (match("transaction")) return res.status(200).send("A **Transaction** groups multiple SQL operations into one atomic unit — either all succeed or all fail (ACID properties).\n\n```sql\nBEGIN;\n  UPDATE accounts SET balance = balance - 500 WHERE id = 1;\n  UPDATE accounts SET balance = balance + 500 WHERE id = 2;\nCOMMIT; -- or ROLLBACK on error\n```\n\n**ACID**: **A**tomicity · **C**onsistency · **I**solation · **D**urability");
      return res.status(200).send("**SQL** is the standard language for relational databases (PostgreSQL, MySQL, SQLite). 🗄️\n\nCore topics:\n- **DDL** — `CREATE`, `ALTER`, `DROP`\n- **DML** — `SELECT`, `INSERT`, `UPDATE`, `DELETE`\n- **Joins** — INNER, LEFT, RIGHT, FULL OUTER\n- **Aggregates** — `COUNT`, `SUM`, `AVG`, `GROUP BY`, `HAVING`\n- **Subqueries & CTEs** — `WITH` clause\n- **Indexes & Transactions**\n- **PostgreSQL extras** — JSONB, window functions, full-text search\n\nWhat SQL topic do you want to go deeper on?");
    }

    // Full Stack / Node.js
    if (match("fullstack", "full stack", "full-stack", "node", "nodejs", "express", "rest api", "backend", "frontend")) {
      if (match("rest api", "restful")) return res.status(200).send("A **REST API** uses HTTP methods to perform CRUD operations on resources:\n\n| Method | Action | Example |\n|---|---|---|\n| `GET` | Read | `GET /users/:id` |\n| `POST` | Create | `POST /users` |\n| `PUT/PATCH` | Update | `PUT /users/:id` |\n| `DELETE` | Delete | `DELETE /users/:id` |\n\nBest practices: use proper status codes (200/201/400/404/500), version your API (`/v1/`), and always validate inputs.");
      if (match("express", "middleware")) return res.status(200).send("**Express.js** is a minimal Node.js web framework.\n\n```js\nconst app = express();\napp.use(express.json());           // middleware: parse JSON body\napp.use('/users', usersRouter);    // route mounting\napp.use((err, req, res, next) => { // error handling middleware\n  res.status(500).json({ error: err.message });\n});\n```\n**Middleware** runs between request and response — great for auth, logging, validation.");
      return res.status(200).send("**Full Stack Development** means building both the frontend (UI) and backend (server + database). 🖥️\n\nQuizShazam itself is a full stack app:\n- **Frontend**: Next.js + Tailwind CSS + React Query\n- **Backend**: Node.js + Express.js + MongoDB + Mongoose\n- **Auth**: JWT + Google OAuth\n- **Storage**: Azure Blob Storage\n- **Email**: Sendinblue\n\nTopics in the quiz: REST APIs, authentication, database design, deployment, and more!");
    }

    // ── 8. Motivation / Struggling ────────────────────────────────────────
    if (match("fail", "failed", "bad score", "low score", "struggle", "hard", "difficult", "can't", "give up", "help me", "bura score")) {
      return res.status(200).send(
        `Hey ${userName}, don't be too hard on yourself! 💪\n\n` +
        `Every expert was once a beginner. Here's what I suggest:\n` +
        `1. **Review the questions you got wrong** — the results page shows correct answers.\n` +
        `2. **Study the concept** — ask me to explain any topic you're unsure about.\n` +
        `3. **Retake the quiz** — repetition builds confidence.\n\n` +
        `You've already taken **${quizCount} quiz${quizCount !== 1 ? "zes" : ""}** — that's more than most people! Keep going. 🔥`
      );
    }

    // ── 9. Developer / Contact ────────────────────────────────────────────
    if (match("developer", "contact", "deepak", "support", "who built", "who made", "creator", "feedback")) {
      return res.status(200).send("**QuizShazam** was built by **Deepak Negi** 👨‍💻\n\n📞 Phone: +91 7292098071\n📧 Email: ayushdeepnegi@gmail.com\n\nFor bugs, feedback, or questions — feel free to reach out directly!");
    }

    // ── 10. Goodbye ───────────────────────────────────────────────────────
    if (match("bye", "goodbye", "see you", "later", "alvida", "baad mein")) {
      return res.status(200).send(`See you later, **${userName}**! 👋 Keep studying and best of luck on your next quiz. You've got this! 🌟`);
    }

    // ── 11. Thanks ────────────────────────────────────────────────────────
    if (match("thank", "thanks", "shukriya", "dhanyavad", "ty ")) {
      return res.status(200).send(`You're welcome, **${userName}**! 😊 That's what I'm here for. Anything else you'd like to know?`);
    }

    // ── 12. Specific quiz lookup by name ──────────────────────────────────
    for (const q of quizzes) {
      if (msg.includes(q.title.toLowerCase())) {
        const taken = takenIds.includes(q._id.toString());
        const myResult = userResponses.find(r => r.quiz?._id?.toString() === q._id.toString());
        let extra = taken && myResult
          ? `\n\nYou already took this quiz and scored **${myResult.score}/${q.questions.length}** (${Math.round((myResult.score / q.questions.length) * 100)}%). Retake it to improve!`
          : "\n\nYou haven't tried this one yet — go for it! 🎯";
        return res.status(200).send(
          `**${q.title}** 🎓\n\n` +
          `📋 ${q.description || "A challenging quiz to test your knowledge."}\n` +
          `❓ Questions: **${q.questions.length}**` +
          extra
        );
      }
    }

    // ── Fallback ──────────────────────────────────────────────────────────
    const suggestions = [
      `"What is my score?"`,
      `"Show me available quizzes"`,
      `"Explain closures in JavaScript"`,
      `"What is a JOIN in SQL?"`,
      `"Recommend a quiz for me"`,
      `"How does QuizShazam work?"`,
    ];
    return res.status(200).send(
      `Hmm, I'm not sure how to answer that! 🤔\n\nHere are some things you can ask me:\n` +
      suggestions.map(s => `- ${s}`).join("\n")
    );

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).send("Oops! Something went wrong. Please try again in a moment.");
  }
};


// ── Update profile ────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { username, bio, phone } = req.body;
  const photo = req.file;
  try {
    const updates = {};
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;

    if (photo) {
      const b64 = `data:${photo.mimetype};base64,${photo.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(b64, {
        folder: "quizshazam/profiles",
        public_id: `profile-${userId}`,
        overwrite: true,
        resource_type: "image",
      });
      updates.photoURL = result.secure_url;
    }

    const updated = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password -twoFactorSecret");
    res.status(200).json({ user: updated });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// ── 2FA: generate secret + QR code ───────────────────────────────────────────
const setup2FA = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    const secret = speakeasy.generateSecret({ name: `QuizShazam (${user.email})`, length: 20 });

    // Persist the secret (not yet enabled)
    await User.findByIdAndUpdate(userId, { twoFactorSecret: secret.base32 });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    res.status(200).json({ qrCode, secret: secret.base32 });
  } catch (error) {
    console.error("setup2FA error:", error);
    res.status(500).json({ error: "Failed to set up 2FA" });
  }
};

// ── 2FA: verify token and enable ─────────────────────────────────────────────
const enable2FA = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user.twoFactorSecret) return res.status(400).json({ error: "Run setup first" });

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) return res.status(400).json({ error: "Invalid code. Try again." });

    await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });
    res.status(200).json({ message: "2FA enabled successfully" });
  } catch (error) {
    console.error("enable2FA error:", error);
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
};

// ── 2FA: disable ─────────────────────────────────────────────────────────────
const disable2FA = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;
  try {
    const user = await User.findById(userId);
    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) return res.status(400).json({ error: "Invalid code. Try again." });

    await User.findByIdAndUpdate(userId, { twoFactorEnabled: false, twoFactorSecret: "" });
    res.status(200).json({ message: "2FA disabled" });
  } catch (error) {
    console.error("disable2FA error:", error);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
};

// ── 2FA: validate code during login (uses tempToken) ─────────────────────────
const validate2FALogin = async (req, res) => {
  const { tempToken, code } = req.body;
  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.twoFactorPending) return res.status(400).json({ error: "Invalid token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!valid) return res.status(400).json({ error: "Invalid code. Try again." });

    const token = jwt.sign(
      { id: user._id, ...(user.role ? { role: user.role } : {}) },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ token, photoURL: user.photoURL });
  } catch (error) {
    console.error("validate2FALogin error:", error);
    res.status(400).json({ error: "Token expired or invalid. Please log in again." });
  }
};

const getUserHistory = async (req, res) => {
  const { userId } = req.params;
  try {
    const responses = await Response.find({ user: userId })
      .populate("quiz", "title isDeleted")
      .populate({
        path: "answers.questionId",
        select: "questionText options explanation referenceLink topic difficulty",
      })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ responses });
  } catch (error) {
    console.error("getUserHistory error:", error.message);
    res.status(500).json({ message: "Error retrieving user history", error: error.message });
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
  googleLogin,
  updateProfile,
  setup2FA,
  enable2FA,
  disable2FA,
  validate2FALogin,
  getUserHistory,
}
