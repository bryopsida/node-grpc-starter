const logger = require('pino')({
  name: 'root',
  level: process.env.LOGGER_LEVEL ?? 'info'
})

function getLogger (opts) {
  return logger.child(opts)
}

module.exports = getLogger
