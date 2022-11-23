// after auth middleware
// 401 Unauthorized -> when user tries to access a protected resource but not token valid - retry
// 403 Forbidden -> verified token but not allowed - dont try again, no access to resource

module.exports = (req, res, next) => {
  if (!req.user.isAdmin) return res.status(403).send({ message: 'Access denied.' })
  next()
}
