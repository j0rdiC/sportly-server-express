const crypto = require("crypto")

const generateImgKey = (bytes = 8) => crypto.randomBytes(bytes).toString("hex")

console.log(generateImgKey())
