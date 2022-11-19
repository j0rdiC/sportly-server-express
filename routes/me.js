const bcrypt = require("bcrypt")
const express = require("express")
const auth = require("../middleware/auth")
const admin = require("../middleware/admin")
const { User } = require("../models/user")
const asyncMiddleware = require("../middleware/async")

const router = express.Router()

router
  .route("/users/me/private")
  .get(
    auth,
    asyncMiddleware(async (req, res) => {
      const user = await User.findById(req.user._id).select("-password")
      return res.json(user)
    })
  )
  .put(auth, async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true })
    return res.json(user)
  })

module.exports = router
