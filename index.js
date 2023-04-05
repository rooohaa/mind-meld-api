import { Configuration, OpenAIApi } from "openai"
import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import { openAiConfig } from "./config/openAiConfig.js"

dotenv.config()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)
const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (_, res) => {
  res.send({
    message: "Hello from MindMeld API",
  })
})

app.post("/prompt", async (req, res) => {
  const { prompt = "" } = req.body

  if (!prompt) {
    return res.status(400).send({ message: "Prompt is required.." })
  }

  try {
    const response = await openai.createCompletion({
      ...openAiConfig,
      prompt,
    })

    res.status(200).send({
      response: response.data.choices[0].text,
    })
  } catch (error) {
    console.error(error)
    res.status(500).send(error || "Something went wrong...")
  }
})

app.listen(8000, () => console.log("Server started on http://localhost:8000"))
