const grpc = require('@grpc/grpc-js')
const { ReflectionService } = require('@grpc/reflection')
const { HealthImplementation } = require('grpc-health-check')
const protoLoader = require('@grpc/proto-loader')
const { resolve, join } = require('path')
const { unaryEcho, bidirectionalStreamingEcho, serverStreamingEcho, clientStreamingEcho } = require('./services/echo')
const getCredentials = require('./services/credential')

const logger = require('./services/logger')({
  name: 'server.js'
})

grpc.setLogger(logger)
grpc.setLogVerbosity(grpc.logVerbosity.DEBUG)

// define health status map
const statusMap = {
  ServiceEcho: 'NOT_SERVING'
}
const healthImpl = new HealthImplementation(statusMap)

const PROTO_PATH = resolve(join(__dirname, 'server.proto'))

const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })
const protoPackage = grpc.loadPackageDefinition(packageDefinition)

function buildServer () {
  const reflection = new ReflectionService(protoPackage)
  const server = new grpc.Server()
  server.addService(protoPackage.grpc.examples.echo.Echo.service, {
    unaryEcho,
    clientStreamingEcho,
    bidirectionalStreamingEcho,
    serverStreamingEcho
  })
  healthImpl.addToServer(server)
  reflection.addToServer(server)
  return server
}

/**
 * Starts an RPC server that receives requests for the Echo service at the
 * sample server port
 */
async function startServer (server, port) {
  logger.info('Starting server on %d', port)
  // it's expected that these are loaded in via dotenv
  // depending on your security needs, you may want to use
  // a .env.vault to hold the private keys
  const credentials = await getCredentials({
    // the the root trust chain, set this to the set of public certs
    // that can issue client certificates and will be trusted
    tlsCertPath: process.env.SERVER_CERT_PATH,
    // if you intend to run plain text and secure the endpoint via other means, or
    // it can be open, use this to supress the warning message on startup
    suppressInsecureWarning: process.env.SERVER_SUPRESS_INSECURE_WARNING,
    // The set of private/public key pairs available to the server
    keyPairs: process.env.SERVER_KEY_PAIRS != null ? JSON.parse(process.env.SERVER_KEY_PAIRS) : undefined,
    // check valid hostname for client certificate, this requires proper hostname resolution
    // if you do not have that, set this to false
    checkClientCertificate: process.env.SERVER_VALIDATE_CLIENT_CERT
  })
  return new Promise((resolve, reject) => {
    server.bindAsync(port, credentials, (err, port) => {
      if (err != null) {
        return reject(err)
      }
      healthImpl.setStatus('serviceBar', 'SERVING')
      logger.info('gRPC listening on %d', port)
      resolve(server)
    })
  })
}

function stopServer (server, port) {
  logger.info('Stopping server')
  // unbind
  server.unbind(port)
  // drain
  server.drain(port, 1000)
  // tryShutdown
  return new Promise((resolve, reject) => {
    server.tryShutdown((err) => {
      if (err) {
        logger.error('Error while shutting down server %j', err)
        return reject(err)
      }
      resolve()
    })
  })
}

function buildAndStart (port) {
  const server = buildServer()
  return startServer(server, port)
}

module.exports = {
  buildAndStart,
  startServer,
  buildServer,
  stopServer
}
