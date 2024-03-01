const { describe, before, after } = require('node:test')
const { join, resolve } = require('node:path')
const { mkdtemp, rm, readFile, writeFile } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { bootstrapPKI } = require('../tools/bootstrapPKI')
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

describe('dockerTLSE2E', () => {
  const state = {
    container: undefined,
    client: undefined
  }
  before(async () => {
    const tag = 'ghcr.io/bryopsida/node-grpc-starter:ci'
    const image = await GenericContainer.fromDockerfile('.').build(tag, {
      deleteOnExit: false
    })
    // setup pki for test
    state.tmpDir = await mkdtemp(resolve(join(tmpdir(), 'certE2ETest')))
    await bootstrapPKI(state.tmpDir)
    const caCert = await readFile(resolve(join(state.tmpDir, 'ca.crt')), { encoding: 'utf-8' })
    const serverCert = await readFile(resolve(join(state.tmpDir, 'server.crt')), { encoding: 'utf-8' })
    const serverKey = await readFile(resolve(join(state.tmpDir, 'server.key')), { encoding: 'utf-8' })
    const clientCert = await readFile(resolve(join(state.tmpDir, 'client.crt')))
    const clientKey = await readFile(resolve(join(state.tmpDir, 'client.key')))
    const clientCA = await readFile(resolve(join(state.tmpDir, 'ca.crt')))

    // create a .env file for the container
    const dotenvFileContents = `DOTENV_OVERRIDE=true
DOTENV_DEBUG=true
SERVER_PORT=3000
SERVER_CA_CERT="${caCert.replaceAll('\n', '\\n')}"
SERVER_KEY_PAIRS=${JSON.stringify([{
    key: serverKey,
    cert: serverCert
}])}
SERVER_VALIDATE_CLIENT_CERT=false
`

    // write the dotenv file out so we can mount it into the container
    const dotenvFilePath = resolve(join(state.tmpDir, '.env'))
    await writeFile(dotenvFilePath, dotenvFileContents, {
      encoding: 'utf-8'
    })

    state.container = await image
      .withCopyFilesToContainer([{
        source: dotenvFilePath,
        target: '/usr/src/app/.env'
      }])
      .withExposedPorts(3000)
      .withWaitStrategy(Wait.forLogMessage(/.*Finished starting server.*/))
      .withLogConsumer(l => l.pipe(process.stdout)).start()
    state.client = new Service(`localhost:${state.container.getMappedPort(3000)}`, grpc.credentials.createSsl(clientCA, clientKey, clientCert))
  })
  after(async () => {
    await state.container.stop()
    await rm(state.tmpDir, {
      recursive: true,
      force: true
    })
  })
  describe('clientTest', () => {
    clientTests(state)
  })
})
