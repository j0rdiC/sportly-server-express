require('dotenv').config()
const debug = require('debug')('app:startup')
const app = require('express')()

const config = require('config')
debug(config.get('name'))

require('./startup/logging')()
require('./startup/middleware')(app)

app.get('/test/:x/:y', (req, res) => {
  const { x, y } = req.params
  console.log(req.params)
  return res.send(`Sum: ${parseInt(x) + parseInt(y)}`)
})

app.get('/test/query', (req, res) => {
  // ../query?name=Jordi&age=10
  const { name, age } = req.query
  console.log(name, age)
  res.send(req.query)
})

require('./startup/routes')(app)
require('./startup/database')()
require('./startup/config')()
require('./startup/validation')()

const python = require('./utils/python')
// python('hello.py', [10, 15])

const port = process.env.PORT || 8000
const server = app.listen(port, () => debug(`Server running on port ${port}`))

module.exports = server
