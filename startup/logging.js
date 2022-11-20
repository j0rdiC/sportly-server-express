require("express-async-errors")
const winston = require("winston")

module.exports = () => {
  process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception: ", err)
    winston.error(err.message, err)
    process.exit(1)
  })

  process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejection: ", err)
    winston.error(err.message, err)
    process.exit(1)
  })

  winston.add(new winston.transports.File({ filename: "logfile.log", level: "info" }))
  winston.add(new winston.transports.File({ filename: "error.log", level: "error" }))
}
