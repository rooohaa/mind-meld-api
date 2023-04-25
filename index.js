import { Configuration, OpenAIApi } from "openai"
import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import { openAiConfig } from "./config/openAiConfig.js"
import { createClient } from "@supabase/supabase-js"
import { generateResumePdf } from "./utils/resumeGenerator.js"

dotenv.config()

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

// Express App configuration
const app = express()

app.use(cors())
app.use(express.json())

// API endpoints
app.get("/", (_, res) => {
  res.send({
    message: "Hello from MindMeld API",
  })
})

app.post("/api/prompt", async (req, res) => {
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

// Student resume pdf generation endpoint
app.get("/api/resume/pdf", async (req, res) => {
  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({
      error: "'userId' query param is required.",
    })
  }

  try {
    const [userPersonal, userSkills, userWorkExperience, userEducation] =
      await Promise.all([
        supabase
          .from("personal_information")
          .select("*")
          .eq("student_id", userId),
        supabase
          .from("professional_skill")
          .select("*")
          .eq("student_id", userId),
        supabase.from("work_experience").select("*").eq("student_id", userId),
        supabase.from("education").select("*").eq("student_id", userId),
      ])

    const userInfoMap = {
      personal: userPersonal.data[0],
      skills: userSkills.data.map((item) => item.skill_name),
      work: userWorkExperience.data,
      education: userEducation.data,
    }

    const pdf = await generateResumePdf(userInfoMap)

    res.set("Content-Type", "application/pdf")
    return res.send(pdf)
  } catch (error) {
    return res.status(500).json({
      detail: "Resume generation error.",
    })
  }
})

app.listen(8000, () => console.log("Server started."))
