const _ = require("lodash")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const express = require("express")
const auth = require("../middleware/auth")
const admin = require("../middleware/admin")
const { User, validate } = require("../models/user")
const handleTokens = require("../utils/handleTokens")

const router = express.Router()

const notFound = (res) => res.status(404).json({ message: "No user found with the given ID." })

// List
router.get("/", async (req, res) => {
  const users = await User.find().select("-password")
  return res.json(users)
})

// Register
router.post("/", async (req, res) => {
  const { email, password } = req.body
  const { error } = validate(email, password)
  if (error) return res.status(400).json({ message: error.details[0].message })

  let user = await User.findOne({ email })
  if (user) return res.status(400).json({ message: "User already registered." })

  const salt = await bcrypt.genSalt(10)
  const hashedPass = await bcrypt.hash(password, salt)

  user = await User.create({
    email,
    password: hashedPass,
  })

  const { access, refresh } = await handleTokens(user)
  return res.status(201).json({ access, refresh })
  // .json(_.pick(user, ["_id", "email"]))
})

// Me
router
  .route("/me")
  .get(auth, async (req, res) => {
    const user = await User.findById(req.user._id)
    return res.json(_.pick(user, ["firstName", "lastName", "_createdAt"]))
  })

  .put(auth, async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true })
    return res.json({ _id: user._id, _updatedAt: user._updatedAt, ...req.body })
  })

  .delete(auth, async (req, res) => {
    const user = await User.findByIdAndDelete(req.user._id)
    return res.status(204).json(user)
  })

module.exports = router
