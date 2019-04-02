const { describe } = require('tape-plus')
const pull = require('pull-stream')
const Server = require('../../testbot')
const unpackLink = require('../../../lib/unpackLink')

const Share = require('../../../share/async/share')

describe('share.async.share', context => {
  let server
  let share
  let recps, name, secret, quorum, attachment

  context.beforeEach(c => {
    server = Server()
    share = Share(server)
    recps = [
      server.createFeed().id,
      server.createFeed().id,
      server.createFeed().id
    ]
    name = 'My SBB Dark Crystal'
    secret = Math.random().toString(36)
    quorum = 3
    attachment = {
      name: 'gossip.json',
      link: '&ERGA0oJCELz2s4sr47f75iXZComB/2akzZq+IpcuqDs=.sha256?unbox=qTWboArROGUrRUjniZGSxh9zcqpdjCSAsJSWYBRqhyQ=.boxs',
      size: 66300,
      type: 'application/json'
    }
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
      assert.equal(err.message, 'data.recps: all recps must be a feedId', 'invalid feedId')

      next()
    })
  })

  context('invalid recps (repeated feedIds)', (assert, next) => {
    const repeatFeed = server.createFeed().id
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

  context('invalid attachment', (assert, next) => {
    attachment.link = 'not a valid link'

    share({ name, secret, quorum, recps, attachment }, (err, data) => {
      assert.ok(err, 'raises error')
      assert.notOk(data, 'data is undefined')
      assert.equal(err.message, 'data.attachment.link: referenced schema does not match')

      next()
    })
  })

  context('throws an error when given an unencrypted blob reference', (assert, next) => {
    attachment.link = '&ERGA0oJCELz2s4sr47f75iXZComB/2akzZq+IpcuqDs=.sha256'
    share({ name, secret, quorum, recps, attachment }, (err, data) => {
      assert.ok(err, 'raises error')
      assert.notOk(data, 'data is undefined')
      assert.equal(err.message, 'Blob not encrypted')
      next()
    })
  })

  context('publishes a root, a ritual and the shards', (assert, next) => {
    share({ name, secret, quorum, recps }, (err, data) => {
      assert.notOk(err, 'error is null')
      assert.ok(data, 'returns the data')

      const pullType = (type) => server.query.read({
        query: [{
          $filter: { value: { content: { type } } }
        }]
      })

      pull(
        pullType('dark-crystal/root'),
        pull.collect((err, roots) => {
          if (err) console.error(err)
          assert.deepEqual(trim(data.root), trim(roots[0]), 'publishes a root')

          pull(
            pullType('dark-crystal/ritual'),
            pull.collect((err, rituals) => {
              if (err) console.error(err)
              assert.deepEqual(trim(data.ritual), trim(rituals[0]), 'publishes a single ritual')

              pull(
                pullType('dark-crystal/shard'),
                pull.collect((err, shards) => {
                  assert.notOk(err, 'no error')
                  assert.deepEqual(data.shards.map(trim), shards.map(trim), 'publishes a set of shards')
                  next()
                })
              )
            })
          )
        })
      )
    })
  })

  context('publishes a root, a ritual and the shards, when a label is given', (assert, next) => {
    const label = 'Give this key to your nearest and dearest'
    share({ name, secret, quorum, label, recps }, (err, data) => {
      assert.notOk(err, 'error is null')
      assert.ok(data, 'returns the data')

      const pullType = (type) => server.query.read({
        query: [{
          $filter: { value: { content: { type } } }
        }]
      })

      pull(
        pullType('dark-crystal/root'),
        pull.collect((err, roots) => {
          if (err) console.error(err)
          assert.deepEqual(trim(data.root), trim(roots[0]), 'publishes a root')

          pull(
            pullType('dark-crystal/ritual'),
            pull.collect((err, rituals) => {
              if (err) console.error(err)
              assert.deepEqual(trim(data.ritual), trim(rituals[0]), 'publishes a single ritual')

              pull(
                pullType('dark-crystal/shard'),
                pull.collect((err, shards) => {
                  assert.notOk(err, 'no error')
                  assert.deepEqual(data.shards.map(trim), shards.map(trim), 'publishes a set of shards')
                  next()
                })
              )
            })
          )
        })
      )
    })
  })

  context('Handles encrypted blob attachment', (assert, next) => {
    share({ name, secret, quorum, recps, attachment }, (err, data) => {
      assert.notOk(err, 'error is null')
      assert.ok(data, 'returns the data')

      const pullType = (type) => server.query.read({
        query: [{
          $filter: { value: { content: { type } } }
        }]
      })

      pull(
        pullType('dark-crystal/root'),
        pull.collect((err, roots) => {
          if (err) console.error(err)
          assert.deepEqual(trim(data.root), trim(roots[0]), 'publishes a root')

          pull(
            pullType('dark-crystal/ritual'),
            pull.collect((err, rituals) => {
              if (err) console.error(err)
              assert.deepEqual(trim(data.ritual), trim(rituals[0]), 'publishes a single ritual')

              pull(
                pullType('dark-crystal/shard'),
                pull.collect((err, shards) => {
                  assert.notOk(err, 'no error')
                  assert.deepEqual(data.shards.map(trim), shards.map(trim), 'publishes a set of shards')

                  data.shards.map(s => s.value.content.attachment).forEach(attached => (
                    assert.deepEqual(
                      attached,
                      unpackLink(attachment.link).blobId,
                      'shard contains blob reference'
                    )
                  ))
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

function trim (msg) {
  delete msg.value.meta
  delete msg.value.private
  delete msg.value.unbox
  delete msg.value.signature
  delete msg.value.cyphertext
  delete msg.rts
  return msg
}
