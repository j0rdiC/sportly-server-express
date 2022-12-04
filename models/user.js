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

    refreshTokens: [String],
    numOfDevices: { type: Number, default: 5 },
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
          { expiresIn: '15m' }
        )
      },

      // calling .save() works without async/await and takes 150ms
      // when using async/await it takes 200ms
      // .save() requires async/await when called from a controller

      // calling .updateOne() requires async/await and takes 200ms
      // why?

      // create new table for refresh tokens? better for deleting after certain time with mongo TTL
      // or just delete the refresh token from the user document with cron job? better for performance

      generateRefreshToken: async function () {
        const token = jwt.sign({ _id: this._id }, config.get('jwtRKey'), { expiresIn: '7d' })

        if (this.refreshTokens.length >= this.numOfDevices) this.refreshTokens.shift()

        this.refreshTokens.push(token)
        await this.save()

        return token
      },

      handleRefreshToken: async function (token) {
        const newToken = jwt.sign({ _id: this._id }, config.get('jwtRKey'), { expiresIn: '7d' })

        if (this.refreshTokens.includes(token)) {
          const i = this.refreshTokens.indexOf(token)
          this.refreshTokens[i] = newToken
        } else if (this.refreshTokens.length >= this.numOfDevices) {
          this.refreshTokens.shift()
          this.refreshTokens.push(newToken)
        } else this.refreshTokens.push(newToken)

        await this.save()

        return newToken
      },

      deleteRefreshToken: async function (token) {
        const i = this.refreshTokens.indexOf(token)
        this.refreshTokens.splice(i, 1)
        await this.save()
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
