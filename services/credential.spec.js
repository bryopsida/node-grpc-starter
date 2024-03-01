const { describe, it, before, after } = require('node:test')
const { mkdtemp, rm, readFile } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')
const assert = require('node:assert')
const getCredentials = require('./credential')
const { bootstrapPKI } = require('../tools/bootstrapPKI')

describe('services/credential.js', () => {
  describe('getCredentials', () => {
    let tmpDir
    before(async () => {
      tmpDir = await mkdtemp(resolve(join(tmpdir(), 'certTest')))
      await bootstrapPKI(tmpDir)
    })
    after(async () => {
      await rm(tmpDir, {
        recursive: true,
        force: true
      })
    })
    it('should build  server credential when provided properties', async () => {
      const creds = await getCredentials({
        caCert: await readFile(resolve(join(tmpDir, 'ca.crt')), { encoding: 'utf-8' }),
        keyPairs: [{
          key: await readFile(resolve((join(tmpDir, 'server.key'))), { encoding: 'utf-8' }),
          cert: await readFile(resolve((join(tmpDir, 'server.crt'))), { encoding: 'utf-8' })
        }]
      })
      assert.ok(creds != null, 'Credential object is defined')
      assert.ok(creds.options.ca != null, 'Credential object is defined')
      assert.ok(creds.options.cert != null, 'Cert object is defined')
      assert.ok(creds.options.key != null, 'Private key is defined')
    })
    it('should build insecure credentials when no props are provided', async () => {
      const creds = await getCredentials()
      assert.ok(creds != null, 'Credential object is defined')
    })
  })
})
