require("dotenv").config();
const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const { GoogleGenerativeAI } = require("@google/generative-ai")

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

app.post("/analyze", async (req, res) => {
  try {
    const { expectedText, spokenText } = req.body

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash"
    })

    const prompt = `
You are Verba AI, an inclusive AI reading assistant.

Compare the expected text with the student's spoken text.

Expected text:
${expectedText}

Student's spoken text:
${spokenText}

Identify:
1. Skipped words
2. Repeated words
3. Difficult words
4. Reading difficulties
5. Helpful suggestions

Return ONLY valid JSON in this format:

{
  "skippedWords": [],
  "repeatedWords": [],
  "difficultWords": [],
  "suggestions": []
}
`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    res.json({ result: response })
 } catch (error) {
  console.error("FULL GEMINI ERROR:");
  console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

  res.status(500).json({
    error: error.message || String(error)
  });
}
})

app.listen(5000, () => {
  console.log("Verba AI backend running on http://localhost:5000")
})