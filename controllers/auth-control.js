const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const express = require('express')
const { User, validate } = require('../models/user')
const auth = require('../middleware/auth')
const handleTokens = require('../utils/handleTokens')

const registerUser = async (req, res) => {
  const { email, password } = req.body
  const { error } = validate(email, password)
  if (error) return res.status(400).json({ message: error.details[0].message })

  let user = await User.findOne({ email })
  if (user) return res.status(400).json({ message: 'User already registered.' })

  const salt = await bcrypt.genSalt(10)
  const hashedPass = await bcrypt.hash(password, salt)

  user = await User.create({
    email,
    password: hashedPass,
  })

  const { access, refresh } = await handleTokens(user)
  return res.status(201).json({ access, refresh })
  // .json(_.pick(user, ["_id", "email"]))
}

const loginUser = async (req, res) => {
  const { email, password } = req.body
  const { error } = validate(email, password)
  if (error) return res.status(400).json({ message: error.details[0].message })

  const invalidAuth = () => res.status(400).json({ message: 'Invalid email or password' })

  const user = await User.findOne({ email })
  if (!user) return invalidAuth()

  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) return invalidAuth()

  const { access, refresh } = await handleTokens(user)
  return res.json({ access, refresh })
}

const handleRefreshToken = async (req, res) => {
  const decoded = jwt.verify(req.body.refresh, process.env.JWT_KEY)
  const user = await User.findById(decoded._id)
  if (user.refreshToken !== req.body.refresh)
    return res.send(403).json({ message: 'Refresh token does not match with user.' })

  const { access, refresh } = await handleTokens(user)
  return res.json({ access, refresh })
}

module.exports = { registerUser, loginUser, handleRefreshToken }
