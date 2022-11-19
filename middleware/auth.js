const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  const token = req.header("Authorization")
  if (!token)
    return res.status(401).json({ message: "Access denied. No token provided" })

  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: err.message })
    req.user = decoded
    next()
  })
}
