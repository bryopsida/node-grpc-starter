/** @module echo */

const logger = require('./logger')({
  name: 'services/echo.js'
})

/**
 * @typedef GrpcCall
 */

/**
 * @callback GrpcCallback
 */

/**
 * Singular call from client that responds to call
 * @param {GrpcCall} call
 * @param {GrpcCallback} callback
 */
function unaryEcho (call, callback) {
  callback(null, call.request)
}

/**
 * Client provides a message and server responds by
 * emitting a message to the clients observable stream
 * @param {GrpcCall} call
 */
function serverStreamingEcho (call) {
  call.write(call.request)
  call.end()
}

/**
 * Client opens observable stream to the server, emits message,
 * server responds with a response object and closes call
 * @param {GrpcCall} call
 */
function clientStreamingEcho (call) {
  call.on('data', value => {
    call.write(value)
  })
  call.on('end', () => {
    logger.info('Client Streamed Request Ended')
    call.end()
  })
}

/**
 * Server and client open observable sequences to each other
 * Client emits a message on it's observable stream,
 * servers relays it back to the clients observable stream
 * and closes
 * @param {GrpcCall} call
 */
function bidirectionalStreamingEcho (call) {
  call.on('data', value => {
    const message = value.message
    logger.info(`echoing message "${message}"`)
    call.write({ message })
  })
  // Either 'end' or 'cancelled' will be emitted when the call is cancelled
  call.on('end', () => {
    logger.info('server received end event')
    call.end()
  })
  call.on('cancelled', () => {
    logger.info('server received cancelled event')
  })
}

module.exports = {
  unaryEcho,
  serverStreamingEcho,
  clientStreamingEcho,
  bidirectionalStreamingEcho
}
