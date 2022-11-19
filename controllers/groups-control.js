const crypto = require("crypto")
const sharp = require("sharp")
const { Group } = require("../models/group")
const handler = require("../utils/request-handler")
const { getObjectSignedUrl, uploadFile, deleteFile } = require("../utils/s3")

const generateFileName = (bytes = 8) => crypto.randomBytes(bytes).toString("hex")

const listGroups = async (req, res) => {
  const groups = await Group.find().lean() //.populate("participants", ["_id", "email"])
  for (let group of groups) group.imageUrl = await getObjectSignedUrl(group.imageName)
  return res.json(groups)
}

const createGroup = async (req, res) => {
  // resize image
  const buffer = await sharp(req.file.buffer).resize({ height: 1920, width: 1080, fit: "contain" }).toBuffer()
  const imageName = req.body.name + generateFileName()
  await uploadFile(req.file.buffer, imageName, req.file.mimetype)
  const group = await Group.create({
    admin: req.user._id,
    imageName,
    ...req.body,
  })
  return res.status(201).json(group)
}

const getGroup = handler.getOne(Group)

const updateGroup = handler.updateOne(Group)

const deleteGroup = async (req, res) => {
  const group = await Group.findById(req.params.id)
  await deleteFile(group.imageName)
  await group.delete()
  return res.sendStatus(204)
}

module.exports = { listGroups, createGroup, getGroup, updateGroup, deleteGroup }
