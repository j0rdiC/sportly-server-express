const { Schema, model } = require('mongoose')
const { ObjectId } = Schema.Types
const Joi = require('joi')

const groupSchema = Schema(
  {
    name: String,
    location: String,
    level: { type: String, enum: ['begginer', 'amateur', 'pro'] },
    type: { type: String, enum: ['friendly', 'competitive'] },
    isPrivate: { type: Boolean, default: false },
    admin: { type: ObjectId, ref: 'User' },
    participants: [{ type: ObjectId, ref: 'User' }],

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
  const schema = {}
}

module.exports = { Group }
