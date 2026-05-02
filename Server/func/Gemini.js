const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Send a message to Gemini with a full system context.
 * @param {string} userMessage
 * @param {string} systemPrompt  - Built per-request with live DB data
 * @returns {Promise<string>}
 */
async function askGemini(userMessage, systemPrompt) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userMessage);
  return result.response.text();
}

module.exports = { askGemini };
