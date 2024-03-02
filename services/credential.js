/** @module credential */

const { ServerCredentials } = require('@grpc/grpc-js')
const getLogger = require('./logger')

const log = getLogger({
  name: 'services/credential.js'
})

/**
 * @typedef GrpcServerKeyPair
 * @property {string} key PEM formatted private key for server
 * @property {string} cert PEM formatted certificate for server
 */

/**
 * Take the configuration properties and create a GRPC
 * credentials object for the server to use
 * @param {*} props Configuration properties
 * @param {string?} props.caCert certificate authority PEM formatted string, if this isn't provided insecure credentials are created
 * @param {boolean?} props.suppressInsecureWarning flag to suppress warning about using insecure credentials
 * @param {Array<GrpcServerKeyPair>} props.keyPairs array of TLS keys the server can use to serve traffic, cert and key are PEM formatted strings
 * @returns {ServerCredentials}
 */
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
  if (props.checkClientCertificate != null && typeof props.checkClientCertificate === 'string') {
    const normVal = props.checkClientCertificate.toLowerCase()
    props.checkClientCertificate = normVal === 'true'
  }
  return ServerCredentials.createSsl(certBuffer, keyPairs, props.checkClientCertificate)
}

module.exports = getCredentials
