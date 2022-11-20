const bcrypt = require('bcrypt')

const main = async () => {
  const salt = await bcrypt.genSalt(10)
  console.log(salt)

  const hashed = await bcrypt.hash('1234', salt)
  console.log(hashed)
}

main()
