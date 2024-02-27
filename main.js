// trigger loading in dotenv first so process.env is hydrated for other imports
// alternatively a pre-load approach can be used at invocation time
// IE -r services/dotenv.js main.js
require('./services/dotenv').load()
const { buildAndStart, stopServer } = require('./server')
const logger = require('./services/logger')({
  name: 'main.js'
})

const listenPort = `0.0.0.0:${process.env.SERVER_PORT ?? 3000}`

async function main (startFunc) {
  return await startFunc({
    port: listenPort,
    suppressInsecureWarning: process.env.SERVER_SUPRESS_INSECURE_WARNING,
    caCertPath: process.env.SERVER_CA_CERT_PATH,
    checkClientCertificate: process.env.SERVER_VALIDATE_CLIENT_CERT,
    keyPairs: process.env.SERVER_KEY_PAIRS != null ? JSON.parse(process.env.SERVER_KEY_PAIRS) : undefined
  })
}

async function cleanup (server) {
  await stopServer(server, listenPort)
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
