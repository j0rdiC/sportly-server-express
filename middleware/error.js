const winston = require("winston")
// error, warn, info, verbose, debug, silly

module.exports = (err, req, res, next) => {
  winston.error(err.message, err)

  return res.status(500).json({ message: "Something went wrong." })
}
