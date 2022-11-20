require('dotenv').config()
const app = require('express')()

require('./startup/logging')()
require('./startup/middleware')(app)
require('./startup/routes')(app)
require('./startup/database')()
require('./startup/config')()
require('./tests/db-testing')()

const port = process.env.PORT || 8000
app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
