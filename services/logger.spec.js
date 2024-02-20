const { describe, it } = require('node:test')
const assert = require('node:assert')
const createLogger = require('./logger')

describe('services/logger.js', () => {
  describe('createLogger', () => {
    it('should return a logger', async () => {
      const logger = createLogger({
        name: 'test'
      })
      assert.notEqual(logger, null)
    })
  })
})
