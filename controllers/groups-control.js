const sharp = require('sharp')
const handler = require('./request-handler')
const { Group, validate } = require('../models/group')
const { generateFileName } = require('../utils/hash')
const { getObjectSignedUrl, uploadFile, deleteFile } = require('../utils/s3')
const { sortByDistance, getDistanceInKm } = require('../utils/distance')
const debug = require('debug')('app:routes')

const addImg = async (collection) => {
  for (let doc of collection) {
    if (doc.imageName) doc.imageUrl = await getObjectSignedUrl(doc.imageName)
  }
}

const addImgAndDistance = async (collection, lat, long) => {
  for (let doc of collection) {
    if (doc.imageName) doc.imageUrl = await getObjectSignedUrl(doc.imageName)
    doc.distance = getDistanceInKm(lat, long, doc.location.lat, doc.location.long)
  }
}

const listGroups = async (req, res) => {
  const { sort } = req.query

  let groups = await Group.find().sort('-_createdAt').populate('members', 'email').lean()

  if (sort === 'all') {
    await addImg(groups)
    return res.send(groups)
  }

  if (sort === 'distance') {
    const { lat, long } = req.query
    await addImgAndDistance(groups, lat, long)
    return res.send(sortByDistance(groups, lat, long))
  }

  if (sort?.includes('level')) {
    groups = groups.filter((group) => group.level === req.query.level)
    if (sort.includes('distance')) {
      const { lat, long } = req.query
      await addImgAndDistance(groups, lat, long)
      return res.send(sortByDistance(groups, lat, long))
    }
    await addImg(groups)
    return res.send(groups)
  }
}

const createGroup = async (req, res) => {
  const { error } = validate(req.body)
  if (error) return handler.validationErr(res, error)

  debug(req.body)

  let imageName
  if (req.file?.buffer) {
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 1920, width: 1080, fit: 'contain' })
      .toBuffer()
    imageName = req.body.name + generateFileName()
    await uploadFile(req.file.buffer, imageName, req.file.mimetype)
  }

  const group = new Group({
    ...req.body,
    admin: req.user._id,
    members: req.user._id,
    location: JSON.parse(req.body.location),
    imageName,
  })
  await group.save()

  res.status(201).send(group)
}

const getGroup = handler.getOne(Group)

// update group, validate, if error return 400, find by id and update group, if no group return 404
// if success return updated fields, id and image name

const updateGroup = async (req, res) => {
  const { error } = validate(req.body)
  if (error) return handler.validationErr(res, error)

  const group = await Group.findById(req.params.id)
  if (!group) return handler.notFound(res, 'group')

  let imageName
  if (req.file?.buffer) {
    imageName = !group.imageName ? group.name + generateFileName() : group.imageName
    await uploadFile(req.file.buffer, imageName, req.file.mimetype)
  }

  await group.updateOne({ ...req.body, imageName }, { runValidators: true })

  res.send({ _id: group._id, _updatedAt: group._updatedAt, ...req.body })
}

const deleteGroup = async (req, res) => {
  const group = await Group.findById(req.params.id)
  if (!group) return handler.notFound(res, 'group')

  if (group.members.length > 0)
    return res.status(400).send({ message: 'A group must be empty before deletion.' })

  await deleteFile(group.imageName)
  await group.delete()

  res.sendStatus(204)
}

const joinGroup = async (req, res) => {
  const group = await Group.findByIdAndUpdate({ _id: req.params.id }, { $push: { members: req.user._id } })
  if (!group) return handler.notFound(res, 'group')

  res.send({ message: `Group ${group.name} joined!` })
}

const leaveGroup = async (req, res) => {
  const group = await Group.findByIdAndUpdate(req.params.id, { $pull: { members: req.user._id } })
  if (!group) return handler.notFound(res, 'group')

  res.send({ message: `Group ${group.name} exited!` })
}

module.exports = { listGroups, createGroup, getGroup, updateGroup, deleteGroup, joinGroup, leaveGroup }
