const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const express = require('express')

module.exports = (app) => {
  app.use(cors())
  app.use(express.json())
  app.use(express.static('public'))
  app.use(helmet())
  // change path to templates, app.set('views', '...'), default=./views
  app.set('view engine', 'pug')
  app.get('env').includes('dev') && app.use(morgan('dev'))
}
