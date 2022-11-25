const mongoose = require('mongoose')
const winston = require('winston')
const config = require('config')
const debug = require('debug')('app:startup')

module.exports = () => {
  const db = process.env.DB_URL
  const dbName = config.get('dbName')

  mongoose
    .connect(db, { dbName })
    .then(() => {
      debug(`Connection to MongoDB/${dbName} established.`)
      winston.info(`Connection to MongoDB/${dbName} established.`)
    })
    .catch((err) => debug(err))
}
