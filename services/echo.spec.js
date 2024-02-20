const { describe, it, mock } = require('node:test')
const assert = require('node:assert')
const { unaryEcho, clientStreamingEcho, serverStreamingEcho, bidirectionalStreamingEcho } = require('./echo')
const EventEmitter = require('node:events')

class CallHelper extends EventEmitter {
  constructor () {
    super()
    this.write = mock.fn()
    this.end = mock.fn()
  }

  sendData (msg) {
    this.emit('data', msg)
  }

  sendEnd () {
    this.emit('end')
  }
}

describe('services/echo.js', () => {
  describe('unaryEcho', () => {
    it('should return a echo response', async () => {
      const call = {
        request: {
          message: 'test'
        }
      }
      const callBack = mock.fn()
      unaryEcho(call, callBack)
      assert.equal(callBack.mock.calls.length, 1)
      assert.equal(callBack.mock.calls[0].arguments[1], call.request)
    })
  })
  describe('clientStreamingEcho', () => {
    it('should echo client messages back', () => {
      const callHelper = new CallHelper()
      // this binds handlers
      clientStreamingEcho(callHelper)
      // need to trigger them
      const data = {
        message: 'test'
      }
      callHelper.sendData(data)
      // trigger end
      callHelper.sendEnd()
      // write should be called with the data we sent
      assert.equal(callHelper.write.mock.calls.length, 1)
      assert.equal(callHelper.write.mock.calls[0].arguments[0], data)
    })
  })
  describe('serverStreamingEcho', () => {
    it('should emit the request back to client', () => {
      const call = {
        request: {
          message: 'test'
        },
        write: mock.fn(),
        end: mock.fn()
      }
      serverStreamingEcho(call)
      assert.equal(call.write.mock.calls.length, 1)
      assert.equal(call.end.mock.calls.length, 1)
      assert.equal(call.write.mock.calls[0].arguments[0], call.request)
    })
  })
  describe('bidirectionalStreamingEcho', () => {
    it('should emit client events back to client', () => {
      const callHelper = new CallHelper()
      bidirectionalStreamingEcho(callHelper)
      // trigger
      const data = {
        message: 'test'
      }
      callHelper.sendData(data)
      callHelper.sendEnd()
      assert.equal(callHelper.write.mock.calls.length, 1)
      assert.equal(callHelper.end.mock.calls.length, 1)
      assert.equal(callHelper.write.mock.calls[0].arguments[0].message, data.message)
    })
  })
})
