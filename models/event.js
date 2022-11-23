const {
  Schema,
  Types: { ObjectId },
  model,
} = require('mongoose')

const eventSchema = new Schema({
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
