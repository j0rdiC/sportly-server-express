require('express-async-errors')
const winston = require('winston')
const debug = require('debug')('app:exceptions')

module.exports = () => {
  process.on('uncaughtException', (err) => {
    debug('Uncaught Exception', err)
    winston.error(err.message, err)
    process.exit(1)
  })

  process.on('unhandledRejection', (err) => {
    debug('Unhandled Rejection', err)
    winston.error(err.message, err)
    process.exit(1)
  })

  winston.add(new winston.transports.File({ filename: 'logfile.log', level: 'info' }))
  winston.add(new winston.transports.File({ filename: 'errors.log', level: 'error' }))
}
