const express = require("express")
const handler = require("../utils/request-handler")
const { Group } = require("../models/group")
const auth = require("../middleware/auth")
const multer = require("multer")
const crypto = require("crypto")
const sharp = require("sharp")
const admin = require("../middleware/admin")
const { getObjectSignedUrl, uploadFile, deleteFile } = require("../utils/s3")
const { resolveSoa } = require("dns")

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const generateFileName = (bytes = 8) => crypto.randomBytes(bytes).toString("hex")

router
  .route("/")
  .get(async (req, res) => {
    const groups = await Group.find().lean() //.populate("participants", ["_id", "email"])
    for (let group of groups) group.imageUrl = await getObjectSignedUrl(group.imageName)
    return res.json(groups)
  })

  .post([auth, upload.single("image")], async (req, res) => {
    // resize image
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 1920, width: 1080, fit: "contain" })
      .toBuffer()

    const imageName = req.body.name + generateFileName()
    await uploadFile(req.file.buffer, imageName, req.file.mimetype)
    const group = await Group.create({
      admin: req.user._id,
      imageName,
      ...req.body,
    })

    return res.status(201).json(group)
  })

router
  .route("/:id")
  .get((req, res) => handler.detail(req, res, Group))
  .put((req, res) => handler.update(req, res, Group))

  .delete(async (req, res) => {
    const group = await Group.findById(req.params.id)
    await deleteFile(group.imageName)
    await group.delete()
    return res.sendStatus(204)
  })

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
