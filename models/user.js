const { Schema, model } = require('mongoose')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const config = require('config')

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 5, maxlength: 1024 },
    firstName: String,
    lastName: String,
    imageName: String,
    gender: { type: String, enum: ['male', 'female'] },
    phone: String,
    birthDate: Date,
    location: String,
    groupPreference: { type: String, enum: ['friendly', 'competitive'] },
    isPremium: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },

    refreshToken: new Schema({
      iv: { type: String, required: true },
      content: { type: String, required: true },
    }),
  },

  {
    timestamps: {
      createdAt: '_createdAt',
      updatedAt: '_updatedAt',
    },

    methods: {
      generateAccessToken: function () {
        return jwt.sign(
          {
            _id: this._id,
            isAdmin: this.isAdmin,
          },
          config.get('jwtAKey'),
          { expiresIn: '7d' }
        )
      },

      generateRefreshToken: function () {
        return jwt.sign({ _id: this._id }, config.get('jwtRKey'), { expiresIn: '30s' })
      },
    },
  }
)

const User = model('User', userSchema)

const validate = (email, password) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(5).max(1024).required(),
  })

  return schema.validate({ email, password })
}

module.exports = { User, validate }
