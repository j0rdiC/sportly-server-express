const router = require('express').Router()
const auth = require('../middleware/auth')
const { image } = require('../middleware/img-upload')
const {
  listGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
} = require('../controllers/groups-control')
const validateId = require('../middleware/validate-id')

// prettier-ignore
router.route('/')
  .get(listGroups)
  .post([auth, image], createGroup)

// prettier-ignore
router.route('/:id')
  .get(validateId ,getGroup)
  .put([auth, image], updateGroup)
  .delete(auth, deleteGroup)

// prettier-ignore
router.route('/:id/join')
  .put(auth, joinGroup)
  .delete(auth, leaveGroup)

module.exports = router
