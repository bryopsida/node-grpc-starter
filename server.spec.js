const { describe, it, mock } = require('node:test')
const assert = require('node:assert')
const { startServer, buildServer } = require('./server')

describe('server.js', () => {
  describe('startServer', () => {
    it('should bind and listen', async () => {
      const server = {
        bindAsync: mock.fn((url, credentials, cb) => {
          assert.equal(url, '0.0.0.0:3000')
          assert.notEqual(credentials, null)
          cb()
        })
      }
      await startServer({
        server,
        port: '0.0.0.0:3000'
      })
    })
  })
  describe('buildServer', () => {
    it('should build a server with echo service', () => {
      const server = buildServer()
      assert.notEqual(server, null)
      assert.equal(server.handlers.has('/grpc.examples.echo.Echo/UnaryEcho'), true)
      assert.equal(server.handlers.has('/grpc.examples.echo.Echo/ServerStreamingEcho'), true)
      assert.equal(server.handlers.has('/grpc.examples.echo.Echo/ClientStreamingEcho'), true)
      assert.equal(server.handlers.has('/grpc.examples.echo.Echo/BidirectionalStreamingEcho'), true)
    })
    it('should build a server with health service', () => {
      const server = buildServer()
      assert.notEqual(server, null)
      assert.equal(server.handlers.has('/grpc.health.v1.Health/Check'), true)
      assert.equal(server.handlers.has('/grpc.health.v1.Health/Watch'), true)
    })
    it('should build a server with reflection service', () => {
      const server = buildServer()
      assert.notEqual(server, null)
      assert.equal(server.handlers.has('/grpc.reflection.v1.ServerReflection/ServerReflectionInfo'), true)
      assert.equal(server.handlers.has('/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo'), true)
    })
  })
})
