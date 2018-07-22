const { describe } = require('tape-plus')
const pull = require('pull-stream')
const Server = require('../../testbot')

const Share = require('../../../share/async/share')

describe('share.async.share', context => {
  let server
  let share
  let recps, name, secret, quorum

  context.beforeEach(c => {
    server = Server()
    share = Share(server)
    recps = [
      server.createFeed().id,
      server.createFeed().id,
      server.createFeed().id
    ]
    name = "My SBB Dark Crystal"
    secret = Math.random().toString(36)
    quorum = 3
  })

  context.afterEach(c => {
    server.close()
  })

  context('takes a specific set of arguments', assert => {
    assert.equal(2, share.length, 'takes two arguments')
  })

  context('invalid params', assert => {
    assert.throws(() => share({ secret, quorum, recps }, () => {}), 'throws an error when name is missing')
    assert.throws(() => share({ name, quorum, recps }, () => {}), 'throws an error when secret is missing')
    assert.throws(() => share({ name, secret, recps }, () => {}), 'throws an error when quorum is missing')
    assert.throws(() => share({ name, secret, quorum }, () => {}), 'throws an error when recps is missing')
    assert.throws(() => share({ name, secret, quorum, recps }), 'throws an error when callback is missing')
    assert.throws(() => share({ name, secret, quorum, recps }, 'not a callback'), 'throws an error when callback is not a function')
  })

  context('invalid recps (non-feed recps)', (assert, next) => {
    recps = ['thisisnotafeed']

    share({ name, secret, quorum, recps }, (err, data) => {
      assert.ok(err, 'raises error')
      assert.notOk(data, 'data is undefined')
      assert.equal(err.message, 'data.recps: must be a feedId', 'invalid feedId')

      next()
    })
  })

  context('invalid recps (repeated feedIds)', (assert, next) => {
    repeatFeed = server.createFeed().id
    recps = [repeatFeed, repeatFeed]

    share({ name, secret, quorum, recps }, (err, data) => {
      assert.ok(err, 'raises error')
      assert.notOk(data, 'data is undefined')
      assert.equal(err.message, 'data.recps: please provide unique feedIds', 'invalid feedId')

      next()
    })
  })

  context('invalid recps (self as recp)', (assert, next) => {
    recps = [server.id]

    share({ name, secret, quorum, recps }, (err, data) => {
      assert.ok(err, 'raises error')
      assert.notOk(data, 'data is undefined')
      assert.equal(err.message, `data.recps: can't include ${server.id}`, 'raises error when includes self')

      next()
    })
  })

  context('invalid quorum', (assert, next) => {
    quorum = 0

    share({ name, secret, quorum, recps }, (err, data) => {
      assert.ok(err, 'raises error')
      assert.notOk(data, 'data is undefined')
      assert.equal(err.message, 'data.quorum: must be greater than 0', 'invalid quorum')

      quorum = recps.length + 1

      share({ name, secret, quorum, recps }, (err, data) => {
        assert.ok(err, 'raises error')
        assert.notOk(data, 'data is undefined')
        assert.equal(err.message, 'data.quorum: greater than number of recps', 'invalid quorum')

        next()
      })
    })
  })

  context('publishes a root, a ritual and the shards', (assert, next) => {
    share({ name, secret, quorum, recps }, (err, data) => {
      assert.notOk(err, 'error is null')
      assert.ok(data, 'returns the data')

      const optsForType = (type) => {
        return { 
          query: [{
            $filter: { value: { content: { type } } }
          }]
        }
      }

      const removeEncryptionData = (message) => {
        delete message.value.signature
        delete message.value.cyphertext
        return message 
      }

      pull(
        server.query.read(optsForType('dark-crystal/root')),
        pull.collect((err, roots) => {
          assert.deepEqual(data.root, removeEncryptionData(roots[0]), 'publishes a root')
         
          pull(
            server.query.read(optsForType('dark-crystal/ritual')),
            pull.collect((err, rituals) => {
              assert.deepEqual(data.ritual, removeEncryptionData(rituals[0]), 'publishes a single ritual')

              pull(
                server.query.read(optsForType('dark-crystal/shard')),
                pull.collect((err, shards) => {
                  assert.deepEqual(data.shards, shards.map(removeEncryptionData), 'publishes a set of shards')
                  next()
                })
              )
            })
          )
        })
      )
    })
  })
})
