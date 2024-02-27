const { describe, it, before, after } = require('node:test')
const { join, resolve } = require('node:path')
const { mkdtemp, rm, readFile } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const assert = require('node:assert')
const { buildAndStart, stopServer } = require('../server')
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const { bootstrapPKI } = require('../tools/bootstrapPKI')

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
  let tmpDir
  before(async () => {
    tmpDir = await mkdtemp(resolve(join(tmpdir(), 'certE2ETest')))
    await bootstrapPKI(tmpDir)
    const port = 'localhost:3001'
    const caCert = await readFile(resolve(join(tmpDir, 'ca.crt')), { encoding: 'utf-8' })
    const serverCert = await readFile(resolve(join(tmpDir, 'server.crt')), { encoding: 'utf-8' })
    const serverKey = await readFile(resolve(join(tmpDir, 'server.key')), { encoding: 'utf-8' })
    const clientCert = await readFile(resolve(join(tmpDir, 'client.crt')))
    const clientKey = await readFile(resolve(join(tmpDir, 'client.key')))
    const clientCA = await readFile(resolve(join(tmpDir, 'ca.crt')))
    server = await buildAndStart({
      port,
      caCert,
      keyPairs: [{
        key: serverKey,
        cert: serverCert
      }]
    })
    client = new Service(port, grpc.credentials.createSsl(clientCA, clientKey, clientCert))
  })
  after(async () => {
    await stopServer(server)
    await rm(tmpDir, {
      recursive: true,
      force: true
    })
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
