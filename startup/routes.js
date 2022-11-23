const error = require('../middleware/error')
const users = require('../routes/users')
const auth = require('../routes/auth')
const groups = require('../routes/groups')

module.exports = (app) => {
  app.get('/', (req, res) => res.render('index', { title: 'Sportly App', message: 'Hello' }))

  app.use('/api/auth', auth)
  app.use('/api/users', users)
  app.use('/api/groups', groups)

  app.use(error)
}
