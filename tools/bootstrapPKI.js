const crypto = require('node:crypto')
const forge = require('node-forge')
const fs = require('fs')
const path = require('path')

// this is used for bootstrapping PKI for the TLS E2E tests
// in most cases you will want to use something else to manage your PKI
// not intended for prod use

function generateKeyPair () {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })
}

function createCACert (privateKey, publicKey, attrs) {
  const pki = forge.pki

  const prKey = pki.privateKeyFromPem(privateKey)
  const pubKey = pki.publicKeyFromPem(publicKey)
  const cert = pki.createCertificate()

  cert.publicKey = pubKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + 1
  )
  cert.setExtensions([{
    name: 'basicConstraints',
    cA: true
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }])

  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.sign(prKey, forge.md.sha384.create())

  return pki.certificateToPem(cert)
}

function generateCSR (privateKey, publicKey) {
  const pki = forge.pki

  const prKey = pki.privateKeyFromPem(privateKey)
  const pubKey = pki.publicKeyFromPem(publicKey)

  const csr = forge.pki.createCertificationRequest()
  csr.publicKey = pubKey
  csr.setSubject([
    {
      name: 'commonName',
      value: 'localhost'
    }
  ])

  csr.setAttributes([
    {
      name: 'extensionRequest',
      extensions: [
        {
          name: 'subjectAltName',
          altNames: [
            {
              // 2 is DNS type
              type: 2,
              value: 'localhost'
            },
            {
              type: 2,
              value: '127.0.0.1'
            }
          ]
        }
      ]
    }
  ])

  csr.sign(prKey, forge.md.sha384.create())

  csr.verify()

  const pem = forge.pki.certificationRequestToPem(csr)

  return pem
}

function signCSR (csrPem, caCertPem, caKeyPem) {
  const csr = forge.pki.certificationRequestFromPem(csrPem)
  const caCert = forge.pki.certificateFromPem(caCertPem)
  const caKey = forge.pki.privateKeyFromPem(caKeyPem)

  if (!csr.verify()) {
    throw new Error('Signature not verified.')
  }

  const cert = forge.pki.createCertificate()
  cert.serialNumber = '02'

  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + 1
  )

  cert.setSubject(csr.subject.attributes)
  cert.setIssuer(caCert.subject.attributes)

  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2,
          value: 'localhost'
        },
        {
          type: 2,
          value: '127.0.0.1'
        }
      ]
    }
  ])

  cert.publicKey = csr.publicKey

  cert.sign(caKey, forge.md.sha384.create())
  return forge.pki.certificateToPem(cert)
}
async function bootstrapPKI (folderPath) {
  const caAttrs = [
    {
      name: 'commonName',
      value: 'localhost-ca'
    }
  ]
  const keyPair = generateKeyPair()
  const cert = createCACert(keyPair.privateKey, keyPair.publicKey, caAttrs)

  const serverKeyPair = generateKeyPair()
  const serverCSR = generateCSR(serverKeyPair.privateKey, serverKeyPair.publicKey)
  const signedServerCrt = signCSR(serverCSR, cert, keyPair.privateKey)

  const clientKeyPair = generateKeyPair()
  const clientCSR = generateCSR(clientKeyPair.privateKey, clientKeyPair.publicKey)
  const signedClientCrt = signCSR(clientCSR, cert, keyPair.privateKey)

  fs.writeFileSync(path.resolve(path.join(folderPath, 'ca.crt')), cert, {
    encoding: 'utf-8'
  })

  fs.writeFileSync(path.resolve(path.join(folderPath, 'server.crt')), signedServerCrt, {
    encoding: 'utf-8'
  })

  fs.writeFileSync(path.resolve(path.join(folderPath, 'server.key')), serverKeyPair.privateKey, {
    encoding: 'utf-8'
  })

  fs.writeFileSync(path.resolve(path.join(folderPath, 'client.crt')), signedClientCrt, {
    encoding: 'utf-8'
  })

  fs.writeFileSync(path.resolve(path.join(folderPath, 'client.key')), clientKeyPair.privateKey, {
    encoding: 'utf-8'
  })

  return Promise.resolve()
}

module.exports = {
  bootstrapPKI
}
