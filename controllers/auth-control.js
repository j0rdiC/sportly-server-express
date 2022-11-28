const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User, validate } = require('../models/user')
const { validationErr } = require('./request-handler')
const config = require('config')
const { encrypt, decrypt } = require('../utils/hash')
const capitalize = require('../utils/capitalize')

const registerUser = async (req, res) => {
  const { email, password } = req.body
  const { error } = validate(email, password)
  if (error) return validationErr(res, error)

  let user = await User.findOne({ email })
  if (user) return res.status(400).send({ message: 'User already registered.' })

  const salt = await bcrypt.genSalt(10)
  const hashed = await bcrypt.hash(password, salt)

  user = new User({ email, password: hashed })
  await user.save()

  res.status(201).send(_.pick(user, ['_id', 'email']))
}

const loginUser = async (req, res) => {
  const { email, password } = req.body

  const { error } = validate(email, password)
  if (error) return validationErr(res, error)

  const invalidAuth = () => res.status(400).send({ message: 'Invalid email or password.' })

  const user = await User.findOne({ email })
  if (!user) return invalidAuth()

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return invalidAuth()

  const access = user.generateAccessToken()
  const refresh = await user.generateRefreshToken()

  res.send({ access, refresh })
}

const refreshUser = async (req, res) => {
  const { refresh } = req.body

  jwt.verify(refresh, config.get('jwtRKey'), async (err, decoded) => {
    if (err) return res.status(403).send({ message: `Refresh ${err.message}.` })

    const user = await User.findById(decoded._id)

    if (!user || !user.refreshTokens.includes(refresh))
      return res.status(403).send({ message: 'Invalid refresh token.' })

    const access = user.generateAccessToken()
    const newRefresh = await user.handleRefreshToken(refresh)

    res.send({ access, refresh: newRefresh })
  })
}

const logoutUser = async (req, res) => {
  const { refresh } = req.body

  jwt.verify(refresh, config.get('jwtRKey'), async (err, decoded) => {
    if (err) return res.status(403).send({ message: `Refresh ${err.message}.` })

    const user = await User.findById(decoded._id)
    await user.deleteRefreshToken(refresh)

    res.sendStatus(204)
  })
}

module.exports = { registerUser, loginUser, refreshUser }
