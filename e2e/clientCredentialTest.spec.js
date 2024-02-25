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

describe('e2eTls', () => {
  let server
  let client
  before(async () => {
    const port = 'localhost:3001'
    server = await buildAndStart(port)
    client = new Service(port, grpc.credentials.createInsecure())
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
    })
  })
})
