const mongoose = require('mongoose')
const winston = require('winston')
const config = require('config')
const debug = require('debug')('app:startup')

module.exports = () => {
  const dbName = config.get('dbName')

  mongoose
    .connect(config.get('db'), { dbName })
    .then(() =>
      winston.info('Connection to MongoDB established', debug(`Connection to MongoDB/${dbName} established.`))
    )
    .catch((err) => debug(err))
}
