const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const express = require('express')

module.exports = (app) => {
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(express.static('public'))
  app.use(helmet())
  app.get('env').includes('dev') && app.use(morgan('dev'))
}
