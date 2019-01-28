const { describe } = require('tape-plus')
const Server = require('../../testbot')
const DeleteKeyPairs = require('../../../recover/async/deleteKeyPairs')
const pull = require('pull-stream')

describe('recover.async.deleteKeyPair', context => {
  let server, deleteKeyPairs, custodians, replies
  let rootId, custodianKeys

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

    custodians.forEach(({ id }) => {
      replies[id] = {
        type: 'invite-reply',
        root: rootId,
        branch: '%7jarG2MhBcJ6WOcSpPARoraJ2oOezcEs+3zQG7ShVR0=.sha256',
        accept: true,
        version: '1',
        shareVersion: '2.0.0',
        body: server.ephemeral.boxMessage('something', 'qDPnOmAo6LP0Tpx/uBHLZBq0UPcAUDcuK74tyoahEQE=.curve25519'),
        recps: [ server.id, id ]
      }
    })
  })

  context.afterEach(c => {
    server.close()
  })

  context('Successfully all keypairs associated with a given rootId', (assert, next) => {
    pull(
      pull.values(custodians),
      pull.asyncMap((custodian, cb) => {
        custodian.publish(replies[custodian.id], (err, reply) => {
          if (err) cb(err)
          const dbKey = JSON.stringify({ rootId, recp: custodian.id })
          server.ephemeral.generateAndStore(dbKey, (err, ephPublicKey) => {
            if (err) cb(err)
            custodianKeys.push({ dbKey, ephPublicKey })
            cb(null, custodian)
          })
        })
      }),
      pull.collect((err, output) => {
        if (err) throw err
        deleteKeyPairs(rootId, (err) => {
          assert.notOk(err, 'null errors')
          custodianKeys.forEach(custodianKey => {
            const cipherText = server.ephemeral.boxMessage('something', custodianKey.ephPublicKey)
            server.ephemeral.unBoxMessage(custodianKey.dbKey, cipherText, null, (err, message) => {
              assert.ok(err, 'throws an error when attempting to use a key')
              assert.notOk(message, 'returns no message')
            })
          })
          next()
        })
      })
    )
  })
  // TODO: tests for errors on invalid rootId or recp
})
