const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User, validate } = require('../models/user')
const auth = require('../middleware/auth')
const handleTokens = require('../utils/handleTokens')
const config = require('config')

const registerUser = async (req, res) => {
  const { email, password } = req.body
  const { error } = validate(email, password)
  if (error) return res.status(400).send({ message: error.details[0].message })

  let user = await User.findOne({ email })
  if (user) return res.status(400).send({ message: 'User already registered.' })

  const salt = await bcrypt.genSalt(10)
  const hashedPass = await bcrypt.hash(password, salt)

  user = await User.create({ email, password: hashedPass })

  res.status(201).send(_.pick(user, ['_id', 'email']))
}

const loginUser = async (req, res) => {
  const { email, password } = req.body
  const { error } = validate(email, password)
  if (error) return res.status(400).send({ message: error.details[0].message })

  const invalidAuth = () => res.status(400).send({ message: 'Invalid email or password.' })

  const user = await User.findOne({ email })
  if (!user) return invalidAuth()

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return invalidAuth()

  const { access, refresh } = await handleTokens(user)
  res.send({ access, refresh })
}

const handleRefreshToken = async (req, res) => {
  const decoded = jwt.verify(req.body.refresh, config.get('jwtKey'))
  const user = await User.findById(decoded._id)
  if (user.refreshToken !== req.body.refresh)
    return res.status(403).send({ message: 'Refresh token does not match with user.' })

  const { access, refresh } = await handleTokens(user)
  res.send({ access, refresh })
}

module.exports = { registerUser, loginUser, handleRefreshToken }
