const { describe, before, after } = require('node:test')
const { join, resolve } = require('node:path')
const { mkdtemp, rm, readFile } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { buildAndStart, stopServer } = require('../server')
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const { bootstrapPKI } = require('../tools/bootstrapPKI')
const clientTests = require('./clientTests')

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
  const state = {
    server: undefined,
    client: undefined,
    tmpDir: undefined
  }
  before(async () => {
    state.tmpDir = await mkdtemp(resolve(join(tmpdir(), 'certE2ETest')))
    await bootstrapPKI(state.tmpDir)
    const port = 'localhost:3001'
    const caCert = await readFile(resolve(join(state.tmpDir, 'ca.crt')), { encoding: 'utf-8' })
    const serverCert = await readFile(resolve(join(state.tmpDir, 'server.crt')), { encoding: 'utf-8' })
    const serverKey = await readFile(resolve(join(state.tmpDir, 'server.key')), { encoding: 'utf-8' })
    const clientCert = await readFile(resolve(join(state.tmpDir, 'client.crt')))
    const clientKey = await readFile(resolve(join(state.tmpDir, 'client.key')))
    const clientCA = await readFile(resolve(join(state.tmpDir, 'ca.crt')))
    state.server = await buildAndStart({
      port,
      caCert,
      keyPairs: [{
        key: serverKey,
        cert: serverCert
      }],
      checkClientCertificate: true
    })
    state.client = new Service(port, grpc.credentials.createSsl(clientCA, clientKey, clientCert))
  })
  after(async () => {
    await stopServer(state.server)
    await rm(state.tmpDir, {
      recursive: true,
      force: true
    })
  })
  describe('clientTest', () => {
    clientTests(state)
  })
})
