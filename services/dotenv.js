/** @module dotenv */

const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')

/**
 * @typedef {Object} DotenvConfigOptions
 * @property {string?} path The default path to the .env files, CSV delimited, `.env` is used if this is not provided
 * @property {boolean?} debug Enable dotenv debug logging, false if it not provided
 * @property {boolean?} override Enable override properties in the destintion map for dotenv properties, off by default
 * @property {string} multiline Controls multiline behavior, `line-breaks` is used by default
 */

/**
 * Build the default dotenv options used in the initial load call, also responsible for loading the DOTENV_KEY
 * from the appropriate locations
 * @returns {DotenvConfigOptions}
 */
function buildConfig () {
  const options = {
    // files with .vault will be decrypted with DOTENV_KEY if provided
    path: process.env.DOTENV_FILE_PATHS != null ? process.env.DOTENV_FILE_PATHS.split(',') : undefined,
    // debug the loading process
    debug: process.env.DOTENV_DEBUG == null ? undefined : process.env.DOTENV_DEBUG.toLowerCase() === 'true',
    // if the variable is already defined on process.env override it, default is false
    override: process.env.DOTENV_OVERRIDE == null ? undefined : process.env.DOTENV_OVERRIDE.toLowerCase() === 'true',
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

/**
 * Triggers a sync load of dotenv configuration into process.env
 * @returns {void}
 */
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
