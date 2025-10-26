import express from "express"

const app = express()

const authRoute = express.Router()

authRoute.post("/register", async (req, res) => {
  res.json({message: "User registered successfully"})
})


export default authRoute