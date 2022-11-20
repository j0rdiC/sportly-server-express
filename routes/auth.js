const express = require("express")
const { handleRefreshToken, loginUser, registerUser } = require("../controllers/auth-controller")

const router = express.Router()

router.post("/register", registerUser)
router.post("/token", loginUser)
router.post("/token/refresh", handleRefreshToken)

module.exports = router
