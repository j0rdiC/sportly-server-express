const { Schema, model } = require('mongoose')
const { ObjectId } = Schema.Types
const Joi = require('joi')

const eventSchema = Schema({
  name: String,
  location: String,
  levels: [{ type: String, enum: ['begginer', 'amateur', 'pro'] }],
  competitors: [{ type: ObjectId, ref: 'User' }],
  maxNumOfCompetitors: { type: Number, min: 0 },
  registerStartDate: Date,
  registerFinishDate: Date,
  competitionDate: Date,
  website: String,
})

const Event = model('Event', eventSchema)

module.exports = { Event }