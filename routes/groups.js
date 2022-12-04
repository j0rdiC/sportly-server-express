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

const sortByDistance = require('../utils/distance')
const { Group } = require('../models/group')

router.get('/dist/near', async (req, res) => {
  console.log(req.query)
  const { lat, long } = req.query

  const groups = await Group.find()
  const sorted = sortByDistance(groups, lat, long)

  res.send(sorted)
})

module.exports = router
