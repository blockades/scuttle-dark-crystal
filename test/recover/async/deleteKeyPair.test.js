const { describe } = require('tape-plus')
const Server = require('../../testbot')
const DeleteKeyPair = require('../../../recover/async/deleteKeyPair')

describe('recover.async.deleteKeyPair', context => {
  let server, deleteKeyPair, recp

  context.beforeEach(c => {
    server = Server()
    deleteKeyPair = DeleteKeyPair(server)

    recp = server.createFeed().id
  })

  context.afterEach(c => {
    server.close()
  })

  context('Successfully deletes a keypair', (assert, next) => {
    server.publish({ type: 'post', content: 'some message' }, (err, { key: rootId }) => {
      if (err) console.log(err)
      const dbKey = JSON.stringify({ rootId, recp })
      server.ephemeral.generateAndStore(dbKey, (err, ephPublicKey) => {
        if (err) console.log(err)
        deleteKeyPair(rootId, recp, (err) => {
          assert.notOk(err, 'null errors')
          const cipherText = server.ephemeral.boxMessage('something', ephPublicKey)
          server.ephemeral.unBoxMessage(dbKey, cipherText, null, (err, message) => {
            assert.ok(err, 'throws an error when attempting to use the key')
            assert.notOk(message, 'returns no message')
            next()
          })
        })
      })
    })
  })
  // TODO: tests for errors on invalid rootId or recp
})
