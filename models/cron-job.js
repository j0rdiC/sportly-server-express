const { User } = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('config')
const cron = require('node-cron')

// run this file with node every 24h to delete expired refresh tokens
// get all users with refresh token
// check if the token is expired
// if expired, delete the token

// const deleteExpiredRefreshTokens = async () => {
//   const users = await User.find({ refreshTokens: { $exists: true } })

//   // using async callbacks in forEach loops may cause unexpected results.
//   // use for loop instead

//   for (let user of users) {
//     jwt.verify(user.refreshTokens, config.get('jwtRKey'), async (err, decoded) => {
//       if (err) await user.deleteOne({ refreshToken })
//     })
//   }
// }

// deleteExpiredRefreshTokens()

// make this a cron functinon
// get all users
// for each user, check if the token in the refreshTokens array is expired
// if expired, delete the token in the array

const deleteExpiredRefreshTokens = async () => {
  const users = await User.find({ refreshTokens: { $exists: true } })

  for (let user of users) {
    for (let token of user.refreshTokens) {
      jwt.verify(token, config.get('jwtRKey'), async (err, decoded) => {
        if (err) {
          user.refreshTokens.pull(token)
          await user.save()
        }
      })
    }
  }
}
