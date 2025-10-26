import express from "express"
import { generateResume , downloadResume} from "../controllers/resume.controller.js"


const app = express()

const resumeRoute = express.Router()


resumeRoute.post("/generate-resume", generateResume)
resumeRoute.post("/download-resume", downloadResume)



export default resumeRoute