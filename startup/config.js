const config = require('config')

module.exports = () => {
  if (!config.get('jwtAKey')) {
    console.error('FATAL ERROR: jwt-private-key is not defined.')
    throw new Error('jwt')
    // process.exit(1)
  }
}
