const { describe, before, after } = require('node:test')
const { join, resolve } = require('node:path')
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const clientTests = require('./clientTests')
const { GenericContainer, Wait } = require('testcontainers')

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

describe('dockerE2E', () => {
  const state = {
    container: undefined,
    client: undefined
  }
  before(async () => {
    const tag = 'ghcr.io/bryopsida/node-grpc-starter:ci'
    const image = await GenericContainer.fromDockerfile('.').build(tag, {
      deleteOnExit: false
    })
    state.container = await image.withExposedPorts(3000).withWaitStrategy(Wait.forLogMessage(/.*Finished starting server.*/)).withLogConsumer(l => l.pipe(process.stdout)).start()
    state.client = new Service(`localhost:${state.container.getMappedPort(3000)}`, grpc.credentials.createInsecure())
  })
  after(async () => {
    await state.container.stop()
  })
  describe('clientTest', () => {
    clientTests(state)
  })
})
