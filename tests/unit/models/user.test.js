const { User } = require('../../../models/user')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const config = require('config')

describe('user.generateAcessToken', () => {
  it('should return a valid access JWT', () => {
    const payload = { _id: mongoose.Types.ObjectId(), isAdmin: true }
    const user = User(payload)
    // console.log(`user: ${user}`)
    const token = user.generateAccessToken()
    const decoded = jwt.verify(token, config.get('jwtKey'))
    expect(decoded).toMatchObject(payload)
  })
})

describe('user.generateRefreshToken', () => {
  it('should return a valid encrypted refresh jwt', () => {
    const payload = { _id: mongoose.Types.ObjectId() }
    const user = User(payload)
    const token = user.generateRefreshToken()
    const decoded = jwt.verify(token, config.get('jwtKey'))
    expect(decoded).toMatchObject(payload)
  })
})
