const bcrypt = require('bcrypt')
const crypto = require('crypto')

const generateFileName = (bytes = 8) => crypto.randomBytes(bytes).toString('hex')

module.exports = { generateFileName }

const main = async () => {
  const salt = await bcrypt.genSalt(10)
  console.log(salt)

  const hashed = await bcrypt.hash('1234', salt)
  console.log(hashed)
}
