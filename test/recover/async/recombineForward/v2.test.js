const { describe } = require('tape-plus')

const Server = require('../../../testbot')
const Recombine = require('../../../../recover/async/recombineForward')
const { share } = require('../../../../lib/secrets-wrapper/v2')

describe('recover.async.recombineForward (v2)', context => {
  let server, recombine, alice, bob, carol, root
  let shardHolders, secret, shards, forwardMessages

  context.beforeEach(c => {
    server = Server()
    recombine = Recombine(server)

    // we are holding some shards from alice, bob and carol
    alice = server.createFeed()
    bob = server.createFeed()
    carol = server.createFeed()

    shardHolders = [
      alice.id,
      bob.id,
      carol.id
    ]

    forwardMessages = {}

    secret = Math.random().toString(36)
    shards = share(secret, 3, 2)

    root = '%g1gbRKarJT4au9De2r4aJ+MghFSAyQzjfVnnxtJNBBw=.sha256'
    forwardMessages = shardHolders.reduce((acc, shardHolder) => {
      acc[shardHolder] = {
        type: 'dark-crystal/forward',
        version: '2.0.0',
        root,
        shard: shards.pop(), // fwdd shards are currently totally open
        shardVersion: '2.0.0',
        recps: [shardHolder, server.id]
      }
      return acc
    }, {})
  })

  context.afterEach(c => {
    server.close()
  })

  context('Returns the recombined secret', (assert, next) => {
    alice.publish(forwardMessages[alice.id], (err, aliceForward) => {
      if (err) console.error(err)
      bob.publish(forwardMessages[bob.id], (err, bobForward) => {
        if (err) console.error(err)
        carol.publish(forwardMessages[carol.id], (err, carolForward) => {
          if (err) console.error(err)
          recombine(root, (err, returnedSecret) => {
            if (err) console.error(err)
            assert.notOk(err, 'error is null')
            assert.equal(secret, returnedSecret, 'returns the correct secret')
            next()
          })
        })
      })
    })
  })

  context('Throws an error if quorum is not reached', (assert, next) => {
    alice.publish(forwardMessages[alice.id], (err, aliceForward) => {
      if (err) console.error(err)
      recombine(root, (err, returnedSecret) => {
        assert.ok(err, 'Throws an error')
        assert.notOk(returnedSecret, 'Does not return a secret')
        next()
      })
    })
  })

  context('Throws an error and returns no secret if an invalid shard is found', (assert, next) => {
    forwardMessages[bob.id].shard = 'this is not a shard'

    alice.publish(forwardMessages[alice.id], (err, aliceForward) => {
      if (err) console.error(err)
      bob.publish(forwardMessages[bob.id], (err, bobForward) => {
        if (err) console.error(err)
        carol.publish(forwardMessages[carol.id], (err, carolForward) => {
          if (err) console.error(err)
          recombine(root, (err, returnedSecret) => {
            assert.ok(err, 'Throws an error')
            assert.notOk(returnedSecret, 'Does not return a secret')
            next()
          })
        })
      })
    })
  })

  context('Throws an error when given a rootId for which there is no root message', (assert, next) => {
    const rootId = '%g1gbRKarJT4au9De2r4aJ+MghFSAyQzjfVnnxtJNBBw=.sha256'
    recombine(rootId, (err, returnedSecret) => {
      assert.ok(err, 'Throws an error')
      assert.notOk(returnedSecret, 'Does not return a secret')
      next()
    })
  })
})
