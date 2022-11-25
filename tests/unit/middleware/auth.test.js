const { User } = require('../../../models/user')
const auth = require('../../../middleware/auth')
const {
  Types: { ObjectId },
} = require('mongoose')

describe('auth middleware', () => {
  it('should populate req.user with the payload of a valid JWT', () => {
    const user = {
      _id: ObjectId().toHexString(),
      isAdmin: true,
    }
    const token = new User(user).generateAccessToken()
    const req = { header: jest.fn().mockReturnValue(token) }
    const res = {}
    const next = jest.fn()

    // since auth is a middleware function that takes the req, res and next parameters,
    // we have to mock them
    auth(req, res, next)

    expect(req.user).toMatchObject(user)
  })
})
