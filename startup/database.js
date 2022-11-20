const mongoose = require('mongoose')
const winston = require('winston')
require('dotenv').config()

module.exports = () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      winston.info('Connection to MongoDB established', console.log('Connection to MongoDB established'))
    })
    .catch((err) => console.error(err))
}
