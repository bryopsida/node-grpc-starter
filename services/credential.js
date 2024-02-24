const { ServerCredentials } = require('@grpc/grpc-js')
const { readFile } = require('fs/promises')
const { resolve } = require('path')
const getLogger = require('./logger')

const log = getLogger({
  name: 'services/credential.js'
})

async function getCredentials (props) {
  log.debug('Building server credentials')
  if (props == null || props.tlsCertPath == null) {
    if (props == null || !props.suppressInsecureWarning) {
      log.warn('tlsCertPath not provided to getCredentials, creating insecure credentials, your api is open! Add suppressInsecureWarning to silence this warning.')
    }
    return ServerCredentials.createInsecure()
  }
  log.debug('Loading credentials from %s', props.tlsCertPath)
  const certBuffer = await readFile(resolve(props.tlsCertPath))

  const keyPairs = []
  if (props.keyPairs) {
    for (const pairInfo of props.keyPairs) {
      if (pairInfo.keyPath == null) throw new Error('Invalid keyPair provided in props.keyPairs[], it must contain keyPath')
      if (pairInfo.caPath == null) throw new Error('Invalid keyPair provided in props.keyPairs[], it must contain caPath')
      keyPairs.push({
        private_key: await readFile(resolve(pairInfo.keyPath)),
        cert_chain: await readFile(resolve(pairInfo.caPath))
      })
    }
  }
  return ServerCredentials.createSsl(certBuffer, keyPairs, props.checkClientCertificate)
}

module.exports = getCredentials
