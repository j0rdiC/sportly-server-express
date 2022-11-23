const router = require('express').Router()
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')
const { image } = require('../middleware/img-upload')
const { getUser, updateUser, deleteUser, listUsers } = require('../controllers/users-control')

router.get('/', listUsers)

// prettier-ignore
router.route('/me')
  .get(auth, getUser)
  .put([auth, image], updateUser)
  .delete(auth, deleteUser)

const { Group } = require('../models/group')

router.get('/me/groups', auth, async (req, res) => {
  const groups = await Group.find({ participants: req.user._id })
  if (!groups) return res.status(400).send({ message: 'User does not belong to any group.' })
  return res.send(groups)
})

module.exports = router
