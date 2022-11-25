module.exports = (app) => {
  app.get('/', (req, res) => res.render('index', { title: 'Sportly App', message: 'Hello' }))

  app.use('/api/auth', require('../routes/auth'))
  app.use('/api/users', require('../routes/users'))
  app.use('/api/groups', require('../routes/groups'))

  app.use(require('../middleware/error'))
}
