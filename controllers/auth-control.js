const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User, validate } = require('../models/user')
const { validationErr } = require('./request-handler')
const config = require('config')
const { encrypt, decrypt } = require('../utils/hash')

const registerUser = async (req, res) => {
  const { email, password } = req.body
  const { error } = validate(email, password)
  if (error) return validationErr(res, error)

  let user = await User.findOne({ email })
  if (user) return res.status(400).send({ message: 'User already registered.' })

  const salt = await bcrypt.genSalt(10)
  const hashedPass = await bcrypt.hash(password, salt)

  user = new User({ email, password: hashedPass })
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
  const refresh = user.generateRefreshToken()

  const hashed = encrypt(refresh)
  await user.updateOne({ refreshToken: hashed })

  res.send({ access, refresh: hashed })
}

const refreshUser = async (req, res) => {
  const refreshToken = decrypt(req.body.refresh)

  jwt.verify(refreshToken, config.get('jwtRKey'), async (err, decoded) => {
    if (err) return res.status(401).send({ message: err.message })

    const user = await User.findById(decoded._id)
    if (!user) return res.status(401).send({ message: 'Invalid token.' })

    const access = user.generateAccessToken()
    const refresh = user.generateRefreshToken()

    const hashed = encrypt(refresh)
    await user.updateOne({ refreshToken: hashed })

    return res.send({ access, refresh: hashed })
  })
}

module.exports = { registerUser, loginUser, refreshUser }
