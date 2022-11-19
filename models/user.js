const mongoose = require("mongoose")
const Joi = require("joi")
const jwt = require("jsonwebtoken")

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 5, maxlength: 1024 },
    firstName: String,
    lastName: String,
    phone: String,
    birthDate: Date,
    location: String,
    gender: { type: String, enum: ["male", "female"] },
    groupPreference: { type: String, enum: ["friendly", "competitive"] },
    isPremium: Boolean,
    isAdmin: { type: Boolean, default: false },
    refreshToken: String,
  },

  {
    timestamps: {
      createdAt: "_createdAt",
      updatedAt: "_updatedAt",
    },
  }
)

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    process.env.JWT_KEY,
    { expiresIn: "1d" }
  )
}

userSchema.methods.generateRefreshToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_KEY, {
    expiresIn: "90d",
  })
  return token
}

const validateUser = (email, password) => {
  const schema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().min(5).max(1024).required(),
  })
  return schema.validate({ email, password })
}

exports.User = mongoose.model("User", userSchema)
exports.validate = validateUser
