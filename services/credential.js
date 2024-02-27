const { ServerCredentials } = require('@grpc/grpc-js')
const getLogger = require('./logger')

const log = getLogger({
  name: 'services/credential.js'
})

function getCredentials (props) {
  log.debug('Building server credentials')
  if (props == null || props.caCert == null) {
    if (props == null || !props.suppressInsecureWarning) {
      log.warn('caCert not provided to getCredentials, creating insecure credentials, your api is open! Add suppressInsecureWarning to silence this warning.')
    }
    return ServerCredentials.createInsecure()
  }
  const certBuffer = Buffer.from(props.caCert)

  const keyPairs = []
  if (props.keyPairs) {
    for (const pairInfo of props.keyPairs) {
      if (pairInfo.key == null) throw new Error('Invalid keyPair provided in props.keyPairs[], it must contain key')
      if (pairInfo.cert == null) throw new Error('Invalid keyPair provided in props.keyPairs[], it must contain cert')
      keyPairs.push({
        private_key: Buffer.from(pairInfo.key),
        cert_chain: Buffer.from(pairInfo.cert)
      })
    }
  }
  return ServerCredentials.createSsl(certBuffer, keyPairs, props.checkClientCertificate)
}

module.exports = getCredentials
