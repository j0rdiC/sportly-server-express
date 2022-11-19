module.exports = async (user) => {
  const access = user.generateAccessToken()
  const refresh = user.generateRefreshToken()
  await user.updateOne({ refreshToken: refresh })

  return { access, refresh }
}
