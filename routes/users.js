const express = require('express')
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')
const { getUser, updateUser, deleteUser, listUsers } = require('../controllers/users-control')

const router = express.Router()

router.get('/', listUsers)

// prettier-ignore
router.route('/me')
  .get(auth, getUser)
  .put(auth, updateUser)
  .delete(auth, deleteUser)

module.exports = router
