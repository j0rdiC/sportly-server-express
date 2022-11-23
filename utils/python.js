const { spawn } = require('child_process')

module.exports = (file, args) => {
  const script = spawn('python3', [`./python/${file}`, ...args])

  script.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  script.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`)
  })

  script.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  })
}
