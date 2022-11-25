const jwt = require('jsonwebtoken')
const config = require('config')
const capitalize = require('../utils/capitalize')
const debug = require('debug')('app:middleware')

module.exports = (req, res, next) => {
  const token = req.header('Authorization')
  if (!token) return res.status(401).send({ message: 'Unauthorized. No token provided.' })

  jwt.verify(token, config.get('jwtAKey'), (err, decoded) => {
    if (err) return res.status(401).send({ message: `Unauthorized. ${capitalize(err.message)}.` })

    req.user = decoded
    next()
  })
}
