const { describe, it } = require('node:test')
const assert = require('node:assert')

module.exports = (state) => {
  describe('echoService', () => {
    describe('unaryEcho', () => {
      it('should respond to unary echo requests', (ctx, done) => {
        state.client.unaryEcho({
          message: 'test'
        }, (err, resp) => {
          try {
            assert.equal(err, null)
            assert.equal(resp.message, 'test')
            done()
          } catch (err) {
            done(err)
          }
        })
      })
    })
    describe('clientStreamingEcho', () => {
      it('should respond to client events', (ctx, done) => {
        const data = {
          received: null
        }
        const verify = () => {
          try {
            assert.notEqual(data.received, null)
            assert.equal(data.received.message, 'test')
            done()
          } catch (err) {
            done(err)
          }
        }
        const stream = state.client.clientStreamingEcho((err, value) => {
          if (err) return done(err)
          data.received = value
          verify()
        })
        stream.write({
          message: 'test'
        })
        stream.end()
      })
    })
    describe('serverStreamingEcho', () => {
      it('should reply to call with event', (ctx, done) => {
        const data = {
          received: null
        }
        const verify = () => {
          try {
            assert.notEqual(data.received, null)
            assert.equal(data.received.message, 'test')
            done()
          } catch (err) {
            done(err)
          }
        }
        const stream = state.client.serverStreamingEcho({
          message: 'test'
        })
        stream.on('data', (msg) => {
          data.received = msg
        })
        stream.on('end', () => {
          verify()
        })
      })
    })
    describe('bidirectionalStreamingEcho', () => {
      it('should reply to event with event', (ctx, done) => {
        const data = {
          received: null
        }
        const verify = () => {
          try {
            assert.notEqual(data.received, null)
            assert.equal(data.received.message, 'test')
            done()
          } catch (err) {
            done(err)
          }
        }
        const stream = state.client.bidirectionalStreamingEcho()
        stream.write({
          message: 'test'
        })
        stream.on('data', (msg) => {
          data.received = msg
          stream.end()
        })
        stream.on('end', () => {
          verify()
        })
      })
    })
  })
}
