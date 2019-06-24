const { describe } = require('tape-plus')
const Server = require('../../testbot')
const DeleteKeyPair = require('../../../recover/async/deleteEphemeralKeyPair')
const contextMessage = 'only for testing deletion of an ephemeral keypair'

describe('recover.async.deleteEphemeralKeyPair', context => {
  let server, deleteKeyPair, recp

  context.beforeEach(c => {
    server = Server()
    deleteKeyPair = DeleteKeyPair(server)

    recp = server.createFeed().id
  })

  context.afterEach(c => {
    server.close()
  })

  context('Successfully deletes an ephemeral keypair', (assert, next) => {
    server.publish({ type: 'post', content: 'some message' }, (err, { key: rootId }) => {
      if (err) throw err
      server.ephemeral.generateAndStore({ rootId, recp }, (err, ephPublicKey) => {
        if (err) throw err
        deleteKeyPair(rootId, recp, (err) => {
          assert.notOk(err, 'null errors')
          server.ephemeral.boxMessage('something', ephPublicKey, contextMessage, (err, cipherText) => {
            if (err) throw err
            server.ephemeral.unBoxMessage({ rootId, recp }, cipherText, null, (err, message) => {
              assert.ok(err, 'throws an error when attempting to use the key')
              assert.notOk(message, 'returns no message')
              next()
            })
          })
        })
      })
    })
  })
})
