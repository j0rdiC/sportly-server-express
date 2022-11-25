const router = require('express').Router()
const auth = require('../middleware/auth')
const { loginUser, registerUser, refreshUser } = require('../controllers/auth-control')

router.post('/', loginUser)
router.post('/register', registerUser)
router.post('/refresh', refreshUser)

module.exports = router
