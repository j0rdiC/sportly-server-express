const winston = require('winston')
// error, warn, info, verbose, debug, silly

module.exports = (err, req, res, next) => {
  console.log('Internal Error:', err)
  winston.error(err.message, err)

  return res.status(500).send({ message: 'Something went wrong.' })
}
