const express = require("express")
const handler = require("../utils/request-handler")
const { Group } = require("../models/group")
const auth = require("../middleware/auth")
const admin = require("../middleware/admin")

const router = express.Router()

router
  .route("/")
  .get((req, res) => handler.list(req, res, Group))

  .post(auth, async (req, res) => {
    const group = await Group.create({ admin: req.user._id, ...req.body })
    return res.status(201).json(group)
  })

router
  .route("/:id")
  .get((req, res) => handler.detail(req, res, Group))
  .put((req, res) => handler.update(req, res, Group))
  .delete((req, res) => handler.delete(req, res, Group))

// Leave - join
router
  .route("/:id/join")
  .put(auth, async (req, res) => {
    const group = await Group.findByIdAndUpdate(req.params.id, {
      $push: { participants: req.user._id },
    })
    return res.json({ message: `Group ${group.name} joined!` })
  })

  .delete(auth, async (req, res) => {
    const group = await Group.findByIdAndUpdate(req.params.id, {
      $pull: { participants: req.user._id },
    })
    return res.json({ message: `Group ${group.name} exited!` })
  })

module.exports = router
