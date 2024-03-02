/** @module server */
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

/**
 * @typedef GrpcServer
 *
 */

/**
 *
 * @returns {GrpcServer}
 */
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
 *
 * @param {*} props
 * @returns {Promise<GrpcServer>}
 */
async function startServer (props) {
  if (!props.port) throw new Error('startServer requires props.port')
  if (!props.server) throw new Error('startServer requires props.server')
  logger.info('Starting server on %d', props.port)
  // it's expected that these are loaded in via dotenv
  // depending on your security needs, you may want to use
  // a .env.vault to hold the private keys
  const credentials = await getCredentials(props)
  return new Promise((resolve, reject) => {
    props.server.bindAsync(props.port, credentials, (err, port) => {
      if (err != null) {
        return reject(err)
      }
      healthImpl.setStatus('serviceBar', 'SERVING')
      logger.info('gRPC listening on %d', port)
      resolve(props.server)
    })
  })
}

/**
 * Stop the server functionality on the provided port
 * @param {*} server
 * @param {*} port
 * @returns {Promise<void>} resolves when operation is complete
 */
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

/**
 *
 * @param {ServerStartOptions} props
 * @returns {Promise<GrpcServer>}
 */
function buildAndStart (props) {
  if (!props.port) throw new Error('props.port is required')
  const server = buildServer()
  return startServer({
    ...props,
    ...{
      server
    }
  })
}

module.exports = {
  buildAndStart,
  startServer,
  buildServer,
  stopServer
}
