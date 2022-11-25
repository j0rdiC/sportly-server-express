const router = require('express').Router()
const auth = require('../middleware/auth')
const vId = require('../middleware/validate-object-id')
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

// prettier-ignore
router.route('/')
  .get(listGroups)
  .post([auth, image], createGroup)

// prettier-ignore
router.route('/:id')
  .get(vId, getGroup)
  .put([auth, vId, image], updateGroup)
  .delete([auth, vId], deleteGroup)

// prettier-ignore
router.route('/:id/join')
  .put([auth, vId], joinGroup)
  .delete([auth, vId], leaveGroup)

module.exports = router
