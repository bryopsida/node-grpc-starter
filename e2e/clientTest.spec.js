const { describe, it, before, after } = require('node:test')
const { join, resolve } = require('node:path')
const assert = require('node:assert')
const { buildAndStart, stopServer } = require('../server')
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')

const PROTO_PATH = resolve(join(__dirname, '../', 'server.proto'))

const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })
const Service = grpc.loadPackageDefinition(packageDefinition).grpc.examples.echo.Echo

describe('e2e', () => {
  let server
  let client
  before(async () => {
    server = await buildAndStart()
    client = new Service('localhost:3000', grpc.credentials.createInsecure())
  })
  after(async () => {
    await stopServer(server)
  })
  describe('clientTest', () => {
    describe('echoService', () => {
      describe('unaryEcho', () => {
        it('should respond to unary echo requests', (ctx, done) => {
          client.unaryEcho({
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
          const stream = client.clientStreamingEcho((err, value) => {
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
          const stream = client.serverStreamingEcho({
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
          const stream = client.bidirectionalStreamingEcho()
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
  })
})
