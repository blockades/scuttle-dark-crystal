const { describe } = require('tape-plus')
const Server = require('../../testbot')
const DeleteKeyPairs = require('../../../recover/async/deleteEphemeralKeyPairs')
const pull = require('pull-stream')
const contextMessage = 'only for testing deletion of ephemeral keypairs'

describe('recover.async.deleteEphemeralKeyPairs', context => {
  let server, deleteKeyPairs, custodians, replies
  let rootId, custodianKeys, testPubKey

  context.beforeEach(c => {
    server = Server()
    deleteKeyPairs = DeleteKeyPairs(server)

    custodians = [
      server.createFeed(),
      server.createFeed(),
      server.createFeed()
    ]

    custodianKeys = []
    replies = {}
    rootId = '%H3Uv1nZyVV1h1YmbNJT5fmU469gO5p6YWmXGnRPbSww=.sha256'

    testPubKey = 'qDPnOmAo6LP0Tpx/uBHLZBq0UPcAUDcuK74tyoahEQE=.curve25519'

    custodians.forEach(({ id }) => {
      replies[id] = {
        type: 'invite-reply',
        root: rootId,
        branch: '%7jarG2MhBcJ6WOcSpPARoraJ2oOezcEs+3zQG7ShVR0=.sha256',
        accept: true,
        version: '1',
        shareVersion: '2.0.0',
        recps: [ server.id, id ]
      }
    })
  })

  context.afterEach(c => {
    server.close()
  })

  context('Successfully delete all ephemeral keypairs associated with a given rootId', (assert, next) => {
    pull(
      pull.values(custodians),
      pull.asyncMap((custodian, cb) => {
        server.ephemeral.boxMessage('something', testPubKey, contextMessage, (err, cipherText) => {
          if (err) console.error(err)
          replies[custodian.id].body = cipherText
          custodian.publish(replies[custodian.id], (err, reply) => {
            if (err) cb(err)
            const dbKey = { rootId, recp: custodian.id }
            server.ephemeral.generateAndStore(dbKey, (err, ephPublicKey) => {
              if (err) cb(err)
              custodianKeys.push({ dbKey, ephPublicKey })
              cb(null, custodian)
            })
          })
        })
      }),
      pull.collect((err, output) => {
        if (err) throw err
        deleteKeyPairs(rootId, (err) => {
          assert.notOk(err, 'null errors')
          custodianKeys.forEach(custodianKey => {
            server.ephemeral.boxMessage('something', custodianKey.ephPublicKey, contextMessage, (err, cipherText) => {
              if (err) console.error(err)
              server.ephemeral.unBoxMessage(custodianKey.dbKey, cipherText, contextMessage, (err, message) => {
                assert.ok(err, 'throws an error when attempting to use a key')
                assert.notOk(message, 'returns no message')
              })
            })
          })
          next()
        })
      })
    )
  })
  context('Throws an error if given an invalid rootId', (assert, next) => {
    deleteKeyPairs('foo', (err) => {
      assert.ok(err, 'throws an error')
      next()
    })
  })
})
