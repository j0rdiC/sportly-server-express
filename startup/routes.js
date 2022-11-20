const error = require("../middleware/error")
const users = require("../routes/users")
const auth = require("../routes/auth")
const groups = require("../routes/groups")

module.exports = (app) => {
  app.get("/", (req, res) => res.send("Hello"))

  app.use("/auth", auth)
  app.use("/api/users", users)
  app.use("/api/groups", groups)

  app.use(error)
}
