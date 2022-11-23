const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const express = require('express')

module.exports = (app) => {
  // template engine
  app.set('view engine', 'pug')
  // change  path to templates, default = './views'
  // app.set('views', '')
  app.use(cors())
  app.use(express.json())
  app.use(express.static('public'))
  app.use(helmet())
  app.get('env').includes('dev') && app.use(morgan('dev'))
}
