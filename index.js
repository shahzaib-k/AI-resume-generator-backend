import express from "express"
import authRoute from "./routes/user.route.js"
import resumeRoute from "./routes/resume.route.js"

const app = express()


app.use(express.json());

app.use("/auth", authRoute)
app.use("/api", resumeRoute )


app.listen(5000, () => {
  console.log("Server is running on port 5000")
})