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

const listenPort = `0.0.0.0:${process.env.SERVER_PORT ?? 3000}`

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
async function startServer (server) {
  logger.info('Starting server on %d', listenPort)
  const credentials = await getCredentials({
    tlsCertPath: process.env.SERVER_CERT_PATH
  })
  return new Promise((resolve, reject) => {
    server.bindAsync(listenPort, credentials, (err, port) => {
      if (err != null) {
        return reject(err)
      }
      healthImpl.setStatus('serviceBar', 'SERVING')
      logger.info('gRPC listening on %d', port)
      resolve(server)
    })
  })
}

function stopServer (server) {
  logger.info('Stopping server')
  // unbind
  server.unbind(listenPort)
  // drain
  server.drain(listenPort, 1000)
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

function buildAndStart () {
  const server = buildServer()
  return startServer(server)
}

module.exports = {
  buildAndStart,
  startServer,
  buildServer,
  stopServer
}
