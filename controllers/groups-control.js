const sharp = require('sharp')
const handler = require('./request-handler')
const { Group } = require('../models/group')
const { generateFileName } = require('../utils/hash')
const { getObjectSignedUrl, uploadFile, deleteFile } = require('../utils/s3')

const listGroups = async (req, res) => {
  const groups = await Group.find().sort('-_createdAt').populate('participants', 'email')
  for (let group of groups) {
    group.imageName && (group.imageUrl = await getObjectSignedUrl(group.imageName))
  }
  for (let group of groups) {
    group.culo = 'melon'
  }
  res.send(groups)
}

const createGroup = async (req, res) => {
  const group = Group({
    admin: req.user._id,
    participants: req.user._id,
    ...req.body,
  })

  let imageName
  if (req.file?.buffer) {
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 1920, width: 1080, fit: 'contain' })
      .toBuffer()
    imageName = req.body.name + generateFileName()
    await uploadFile(req.file.buffer, imageName, req.file.mimetype)
  }

  if (imageName) group.imageName = imageName
  await group.save()

  res.status(201).send()
}

const getGroup = handler.getOne(Group)

const updateGroup = handler.updateOne(Group)

const deleteGroup = async (req, res) => {
  const group = await Group.findById(req.params.id)

  if (!group) return handler.notFound(res)

  if (group.participants.length > 0)
    return res.status(400).send({ message: 'A group must be empty before deletion.' })

  await deleteFile(group.imageName)
  await group.delete()

  res.sendStatus(204)
}

const joinGroup = async (req, res) => {
  const group = await Group.updateOne({ _id: req.params.id }, { $push: { participants: req.user._id } })
  res.send({ message: `Group ${group.name} joined!` })
}

const leaveGroup = async (req, res) => {
  const group = await Group.findByIdAndUpdate(req.params.id, { $pull: { participants: req.user._id } })
  res.send({ message: `Group ${group.name} exited!` })
}

module.exports = { listGroups, createGroup, getGroup, updateGroup, deleteGroup, joinGroup, leaveGroup }
