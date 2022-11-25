const { User } = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('config')

// run this file with node every 24h to delete expired refresh tokens
// get all users with refresh token
// check if the token is expired
// if expired, delete the token

const deleteExpiredRefreshTokens = async () => {
  const users = await User.find({ refreshToken: { $exists: true } })

  // using async callbacks in forEach loops may cause unexpected results.
  // use for loop instead

  for (let user of users) {
    jwt.verify(user.refreshToken, config.get('jwtRKey'), async (err, decoded) => {
      if (err) {
        user.refreshToken = undefined
        await user.save()
      }
    })
  }
}

deleteExpiredRefreshTokens()
