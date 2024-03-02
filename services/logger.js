/** @module logger */
const Logger = require('pino')
const logger = Logger({
  name: 'root',
  level: process.env.LOGGER_LEVEL ?? 'info'
})

/**
 *
 * @param {*} opts Options passed to pino.child logger method
 * @returns {Logger}
 */
function getLogger (opts) {
  return logger.child(opts)
}

module.exports = getLogger
