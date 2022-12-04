const router = require('express').Router()
const auth = require('../middleware/auth')
const { loginUser, registerUser, refreshUser } = require('../controllers/auth-control')

const v = require('../middleware/validate-input')
const { validate } = require('../models/user')

router.post('/', loginUser)
router.post('/register', registerUser)
router.post('/refresh', refreshUser)

module.exports = router
