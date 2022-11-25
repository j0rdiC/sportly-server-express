const router = require('express').Router()
const auth = require('../middleware/auth')

const { Event } = require('../models/event')

// get event, only auth users, send 404 if no event with given id
router.get('/:id', auth, async (req, res) => {
  const event = await Event.findById(req.params.id)
  if (!event) return res.status(404).send({ message: 'Event not found.' })
  res.send(event)
})

// get all events, only auth users
router.get('/', auth, async (req, res) => {
  const events = await Event.find()
  res.send(events)
})

const { notFound } = require('../controllers/request-handler')
// delete event, only auth users, send 404 if no event with given id, send 204 if success
router.delete('/:id', auth, async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id)
  if (!event) return notFound(res, 'event')
  res.sendStatus(204)
})
