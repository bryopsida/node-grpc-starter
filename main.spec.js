const { describe, it, mock } = require('node:test')
const assert = require('node:assert')
const main = require('./main')

describe('main.js', () => {
  describe('main', () => {
    it('should start the server', async () => {
      const startServer = mock.fn(() => Promise.resolve())
      await main(startServer)
      assert.equal(startServer.mock.calls.length, 1)
    })
  })
})
