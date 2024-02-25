const { describe, it, before, after } = require('node:test')
const { mkdtemp, rm } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')

describe('services/dotenv.js', () => {
  describe('buildConfig()', () => {
    let tmpDir
    before(async () => {
      tmpDir = await mkdtemp(resolve(join(tmpdir(), 'dotenvTest')))
    })
    after(async () => {
      await rm(tmpDir, {
        recursive: true,
        force: true
      })
    })
    it('should load vault key from filesystem', async () => {

    })
    it('should load vault key from env var', async () => {

    })
    it('should prefer to load vault key from file system', async () => {

    })
  })
})
