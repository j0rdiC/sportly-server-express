const express = require("express")
const handler = require("../utils/request-handler")
const { Group } = require("../models/group")
const auth = require("../middleware/auth")
const multer = require("multer")

const {
  listGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
} = require("../controllers/groups-control")
const admin = require("../middleware/admin")

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

router.get("/handler", handler.list(Group))

router
  .route("/")
  .get(listGroups)
  .post([auth, upload.single("image")], createGroup)

router
  .route("/:id")
  .get(getGroup)
  .put(updateGroup)

  .delete(deleteGroup)

// Leave - join
router
  .route("/:id/join")
  .put(async (req, res) => {
    const group = await Group.findByIdAndUpdate(req.params.id, { $push: { participants: req.user._id } })
    return res.json({ message: `Group ${group.name} joined!` })
  })

  .delete(auth, async (req, res) => {
    const group = await Group.findByIdAndUpdate(req.params.id, { $pull: { participants: req.user._id } })
    return res.json({ message: `Group ${group.name} exited!` })
  })

module.exports = router
