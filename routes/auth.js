const router = require('express').Router()
const { handleRefreshToken, loginUser, registerUser } = require('../controllers/auth-control')

router.post('/', loginUser)
router.post('/register', registerUser)
router.post('/refresh', handleRefreshToken)

module.exports = router
