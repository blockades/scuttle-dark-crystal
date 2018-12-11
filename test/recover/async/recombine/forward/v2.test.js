const { describe } = require('tape-plus')

const Server = require('../../../../testbot')
const Recombine = require('../../../../../recover/async/recombine')
const { share } = require('../../../../../lib/secrets-wrapper/v2')

describe('recover.async.recombine (v2 forward)', context => {
  let server, recombine, alice, bob, carol, root
  let shardHolders, secret, shards, forwardMessages
  let secretWithNickname

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
    secretWithNickname = JSON.stringify([ secret, 'a great secret' ])
    shards = share(secretWithNickname, 3, 2)

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
            assert.equal(secret, returnedSecret.secret, 'returns the correct secret')
            next()
          })
        })
      })
    })
  })

  context('Calls back an error if quorum is not reached', (assert, next) => {
    alice.publish(forwardMessages[alice.id], (err, aliceForward) => {
      if (err) console.error(err)
      recombine(root, (err, returnedSecret) => {
        assert.ok(err, 'Calls back an error')
        assert.notOk(returnedSecret, 'Does not return a secret')
        next()
      })
    })
  })

  context('Ignores junk shards, proceeds to ', (assert, next) => {
    forwardMessages[bob.id].shard = 'this is not a shard'

    alice.publish(forwardMessages[alice.id], (err, aliceForward) => {
      if (err) console.error(err)
      bob.publish(forwardMessages[bob.id], (err, bobForward) => {
        if (err) console.error(err)
        carol.publish(forwardMessages[carol.id], (err, carolForward) => {
          if (err) console.error(err)
          recombine(root, (err, returnedSecret) => {
            assert.notOk(err, 'no error')
            assert.equal(secret, returnedSecret.secret, 'returns the correct secret')
            next()
          })
        })
      })
    })
  })
})
