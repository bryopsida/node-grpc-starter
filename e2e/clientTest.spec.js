const { describe, before, after } = require('node:test')
const { join, resolve } = require('node:path')
const { buildAndStart, stopServer } = require('../server')
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
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

describe('e2e', () => {
  const state = {
    server: undefined,
    client: undefined
  }
  before(async () => {
    state.server = await buildAndStart({ port: 'localhost:3000' })
    state.client = new Service('localhost:3000', grpc.credentials.createInsecure())
  })
  after(async () => {
    await stopServer(state.server)
  })
  describe('clientTest', () => {
    clientTests(state)
  })
})
