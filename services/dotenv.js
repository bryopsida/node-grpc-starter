const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')

function buildConfig () {
  const options = {
    // files with .vault will be decrypted with DOTENV_KEY if provided
    path: process.env.DOTENV_FILE_PATHS != null ? process.env.DOTENV_FILE_PATHS.split(',') : undefined,
    // debug the loading process
    debug: process.env.DOTENV_DEBUG,
    // if the variable is already defined on process.env override it, default is false
    override: process.env.DOTENV_OVERRIDE,
    // allow line breaks in the values to make it easier to read array values
    multiline: 'line-breaks'
  }
  // load the dotenv vault key from a file projected onto the file system
  if (process.env.DOTENV_VAULT_KEY_PATH) {
    // we want to do everything sync so this can be done in commonjs entrypoint which does not support async in imports
    options.DOTENV_KEY = readFileSync(resolve(process.env.DOTENV_VAULT_KEY_PATH))
  }
  if (process.env.DOTENV_KEY && !options.DOTENV_KEY) {
    // if the key is set via an env var, and not provided as a file, use it
    options.DOTENV_KEY = process.env.DOTENV_KEY
  }
  return options
}

function load () {
  return require('dotenv').config(buildConfig())
}

if (require.main === module) {
  load()
} else {
  module.exports = {
    load
  }
}
