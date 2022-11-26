const { User } = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('config')
const cron = require('node-cron')

// run this file with node every 24h to delete expired refresh tokens
// get all users with refresh token
// check if the token is expired
// if expired, delete the token

// make it a cron job to run every 24h

const deleteExpiredRefreshTokens = async () => {
  const users = await User.find({ refreshToken: { $exists: true } })

  // using async callbacks in forEach loops may cause unexpected results.
  // use for loop instead

  for (let user of users) {
    jwt.verify(user.refreshToken, config.get('jwtRKey'), async (err, decoded) => {
      if (err) await user.deleteOne({ refreshToken })
    })
  }
}

deleteExpiredRefreshTokens()
