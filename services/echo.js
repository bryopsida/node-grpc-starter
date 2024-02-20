const logger = require('./logger')({
  name: 'services/echo.js'
})

function unaryEcho (call, callback) {
  callback(null, call.request)
}

function serverStreamingEcho (call) {
  call.write(call.request)
  call.end()
}

function clientStreamingEcho (call) {
  call.on('data', value => {
    call.write(value)
  })
  call.on('end', () => {
    logger.info('Client Streamed Request Ended')
    call.end()
  })
}

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
