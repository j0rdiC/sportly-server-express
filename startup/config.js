require("dotenv").config()

module.exports = () => {
  if (!process.env.JWT_KEY) {
    console.error("FATAL ERROR: jwt-private-key is not defined.")
    throw new Error("jwt")
    // process.exit(1)
  }
}
