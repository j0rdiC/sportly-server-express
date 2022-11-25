const jwt = require('jsonwebtoken')
const config = require('config')
const debug = require('debug')('app:middleware')

module.exports = (req, res, next) => {
  const token = req.header('Authorization')
  if (!token) return res.status(401).send({ message: 'Unauthorized. No token provided.' })

  debug('sign:', config.get('jwtAKey'))

  jwt.verify(token, config.get('jwtAKey'), (err, decoded) => {
    if (err) return res.status(401).send({ message: `Unauthorized. ${err.message}.` })

    req.user = decoded
    next()
  })
}
