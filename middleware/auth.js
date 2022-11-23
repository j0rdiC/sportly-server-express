const jwt = require('jsonwebtoken')
const config = require('config')
const debug = require('debug')('app:middleware')

module.exports = (req, res, next) => {
  debug('entered auth middleware')
  const token = req.header('Authorization')
  if (!token) return res.status(401).send({ message: 'Access denied. No token provided.' })

  debug('auth token provided, verifying...')

  debug('sign:', config.get('jwtKey'))

  jwt.verify(token, config.get('jwtKey'), (err, decoded) => {
    if (err) return res.status(401).send({ message: err.message })
    req.user = decoded
    next()
  })
}
