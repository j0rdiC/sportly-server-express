const _ = require('lodash')
const { User } = require('../models/user')
const { getObjectSignedUrl, uploadFile, deleteFile } = require('../utils/s3')
const { generateFileName } = require('../utils/hash')
const { notFound } = require('./request-handler')
const config = require('config')
const debug = require('debug')('app:routes')

const listUsers = async (req, res) => {
  const users = await User.find().sort('-firstName')
  return res.send(users)
}

const getUser = async (req, res) => {
  const user = await User.findById(req.user._id).lean()
  if (user.imageName) user.imageUrl = await getObjectSignedUrl(user.imageName)
  return res.send(_.pick(user, ['_id', 'email', 'firstName', 'lastName', 'imageUrl', '_createdAt']))
}

const updateUser = async (req, res) => {
  debug('Recieved update user request')
  const user = await User.findById(req.user._id)
  if (!user) return notFound(res, 'user')

  debug('User info updated, looking for file...')

  let imageName
  if (req.file?.buffer) {
    imageName = !user.imageName ? user.firstName + user.lastName + generateFileName() : user.imageName
    debug(
      'File found, calling s3 ' + imageName + !user.imageName
        ? 'has no image, creating... '
        : 'has image, updating... '
    )
    await uploadFile(req.file.buffer, imageName, req.file.mimetype)

    debug('s3 done, updating DB')
  }

  await user.updateOne({ ...req.body, imageName }, { runValidators: true })

  debug('Done, sending response...')
  return res.send({ _id: user._id, _updatedAt: user._updatedAt, ...req.body })
}

const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id)
  return res.status(204).send(user)
}

module.exports = { listUsers, getUser, updateUser, deleteUser }
