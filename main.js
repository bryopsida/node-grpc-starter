require('dotenv').config()
const { buildAndStart, stopServer } = require('./server')
const logger = require('./services/logger')({
  name: 'main.js'
})

async function main (startFunc) {
  await startFunc()
}

async function cleanup (server) {
  await stopServer(server)
}

if (require.main === module) {
  main(buildAndStart).then((server) => {
    logger.info('Finished starting server')
    process.on('SIGINT', () => cleanup(server))
    process.on('SIGTERM', () => cleanup(server))
  }).catch((err) => {
    logger.error('Error while starting server: %s', err.message)
  })
} else {
  module.exports = main
}
