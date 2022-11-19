const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const express = require("express")
const { User, validate } = require("../models/user")
const auth = require("../middleware/auth")
const handleTokens = require("../utils/handleTokens")

const router = express.Router()

// Login
router.post("/token", async (req, res) => {
  const { email, password } = req.body
  const { error } = validate(email, password)
  if (error) return res.status(400).json({ message: error.details[0].message })

  const invalidAuth = () => res.status(400).json({ message: "Invalid email or password" })

  const user = await User.findOne({ email })
  if (!user) return invalidAuth()

  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) return invalidAuth()

  const { access, refresh } = await handleTokens(user)
  return res.json({ access, refresh })
})

// Refresh token
router.post("/token/refresh", async (req, res) => {
  const decoded = jwt.verify(req.body.refresh, process.env.JWT_KEY)
  const user = await User.findById(decoded._id)
  if (user.refreshToken !== req.body.refresh)
    return res.send(403).json({ message: "Refresh token does not match with user." })

  const { access, refresh } = await handleTokens(user)
  return res.json({ access, refresh })
})

module.exports = router
