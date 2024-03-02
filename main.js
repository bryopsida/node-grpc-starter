/** @module main */

// trigger loading in dotenv first so process.env is hydrated for other imports
// alternatively a pre-load approach can be used at invocation time
// IE -r services/dotenv.js main.js
require('./services/dotenv').load()
const { buildAndStart, stopServer } = require('./server')
const logger = require('./services/logger')({
  name: 'main.js'
})

const listenPort = `0.0.0.0:${process.env.SERVER_PORT ?? 3000}`

/**
 * @typedef ServerStartOptions
 * @property {number} listenPort Port number the server will bind its listening port to
 * @property {boolean} suppressInsecureWarning Toggles logging warning when using insecure server credentials
 * @property {string} caCert PEM formatted string of CA cert
 * @property {boolean} checkClientCertificate toggle mTLS behavior, with this off the client certificate is not validated
 * @property {Array<GrpcServerKeyPair>} keyPairs array of server key pairs that can be uses for TLS sessions
 */

/**
 * @callback StartServerDelegate
 * @param {ServerStartOptions} opts Options used for setting up the server
 */

/**
 * Starts the server and resolves with the server object
 * @param {StartServerDelegate} startFunc
 * @returns {Promise<grpc.Server>}
 */
async function main (startFunc) {
  return await startFunc({
    port: listenPort,
    suppressInsecureWarning: process.env.SERVER_SUPRESS_INSECURE_WARNING,
    caCert: process.env.SERVER_CA_CERT,
    checkClientCertificate: process.env.SERVER_VALIDATE_CLIENT_CERT,
    keyPairs: process.env.SERVER_KEY_PAIRS != null ? JSON.parse(process.env.SERVER_KEY_PAIRS) : undefined
  })
}

/**
 * Stop the server
 * @param {grpc.Server} server
 */
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
