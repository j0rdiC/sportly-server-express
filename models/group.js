const { Schema, model } = require('mongoose')
const { ObjectId } = Schema.Types
const Joi = require('joi')

const groupSchema = new Schema(
  {
    name: String,
    // location: String,
    location: {
      lat: Number,
      long: Number,
    },
    level: { type: String, enum: ['begginer', 'amateur', 'pro'] },
    type: { type: String, enum: ['friendly', 'competitive'] },
    isPrivate: { type: Boolean, default: false },
    admin: { type: ObjectId, ref: 'User' },
    members: [{ type: ObjectId, ref: 'User' }],

    imageName: String,
  },

  {
    timestamps: {
      createdAt: '_createdAt',
      updatedAt: '_updatedAt',
    },
  }
)

const Group = model('Group', groupSchema)

const validate = (group) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('friendly', 'competitive'),
    location: Joi.string(),
    level: Joi.string().valid('begginer', 'amateur', 'pro'),
    isPrivate: Joi.boolean(),
    imageName: Joi.string(),
  })

  return schema.validate(group)
}

module.exports = { Group, validate }
