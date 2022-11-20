const express = require('express')
const auth = require('../middleware/auth')
const multer = require('multer')
const {
  listGroups,
  createGroup,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
} = require('../controllers/groups-control')

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// prettier-ignore
router.route('/')
  .get(listGroups)
  .post([auth, upload.single('image')], createGroup)

// prettier-ignore
router.route('/:id')
  .get(getGroup)
  .put(updateGroup)
  .delete(deleteGroup)

// prettier-ignore
router.route('/:id/join')
  .put(auth, joinGroup)
  .delete(auth, leaveGroup)

module.exports = router
