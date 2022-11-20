const _ = require("lodash")
const { User, validate } = require("../models/user")

const listUsers = async (req, res) => {
  const users = await User.find().select("-password")
  return res.json(users)
}

const getUser = async (req, res) => {
  const user = await User.findById(req.user._id)
  return res.json(_.pick(user, ["_id", "email", "firstName", "lastName", "_createdAt"]))
}

const updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true })
  return res.json({ _id: user._id, _updatedAt: user._updatedAt, ...req.body })
}

const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id)
  return res.status(204).json(user)
}

module.exports = { listUsers, getUser, updateUser, deleteUser }
