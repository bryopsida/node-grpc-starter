const { describe, it, before, after } = require('node:test')
const { mkdtemp, rm } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')
const assert = require('node:assert')
const getCredentials = require('./credential')

describe('services/credential.js', () => {
  describe('getCredentials', () => {
    let tmpDir
    before(async () => {
      tmpDir = await mkdtemp(resolve(join(tmpdir(), 'certTest')))
    })
    after(async () => {
      await rm(tmpDir, {
        recursive: true,
        force: true
      })
    })
    it('should build  server credential when provided properties', async () => {
      const creds = await getCredentials({
        tlsCertPath: '',
        keyPairs: [{
          keyPath: '',
          caPath: ''
        }]
      })
      assert.ok(creds != null, 'Credential object is defined')
    })
    it('should build insecure credentials when no props are provided', async () => {
      const creds = await getCredentials()
      assert.ok(creds != null, 'Credential object is defined')
    })
  })
})
