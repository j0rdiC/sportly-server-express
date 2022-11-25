const bcrypt = require('bcrypt')
const crypto = require('crypto')

const testPass = async () => {
  const salt = await bcrypt.genSalt(10)
  console.log(salt)

  const hashed = await bcrypt.hash('1234', salt)
  console.log(hashed)
}

const algorithm = 'aes-256-ctr'
const secretKey = crypto.randomBytes(32)

const encrypt = (data) => {
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, secretKey, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  }
}

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'))
  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()])

  return decrpyted.toString()
}

const generateFileName = (bytes = 8) => crypto.randomBytes(bytes).toString('hex')

module.exports = { encrypt, decrypt, generateFileName }
