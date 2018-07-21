const { group } = require('tape-plus')
const test = require('tape')
const pull = require('pull-stream')
const Server = require('../../testbot')

const Share = require('../../../share/async/share')

group('share.async.share', test => {
  let server
  let share
  let recps, name, secret, quorum

  test.beforeEach(c => {
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

  test.afterEach(c => {
    server.close()
  })

  test('takes a specific set of arguments', t => {
    t.equal(2, share.length, 'takes two arguments')
  })

  test('invalid params', t => {
    t.throws(() => share({ secret, quorum, recps }, () => {}), 'throws an error when name is missing')
    t.throws(() => share({ name, quorum, recps }, () => {}), 'throws an error when secret is missing')
    t.throws(() => share({ name, secret, recps }, () => {}), 'throws an error when quorum is missing')
    t.throws(() => share({ name, secret, quorum }, () => {}), 'throws an error when recps is missing')
    t.throws(() => share({ name, secret, quorum, recps }), 'throws an error when callback is missing')
    t.throws(() => share({ name, secret, quorum, recps }, 'not a callback'), 'throws an error when callback is not a function')
  })

  test('invalid recps (non-feed recps)', (t, next) => {
    recps = ['thisisnotafeed']

    share({ name, secret, quorum, recps }, (err, data) => {
      t.ok(err, 'raises error')
      t.notOk(data, 'data is undefined')
      t.equal(err.message, 'data.recps: must be a feedId', 'invalid feedId')

      server.close()
      next()
    })
  })

  test('invalid recps (repeated feedIds)', (t, next) => {
    repeatFeed = server.createFeed().id
    recps = [repeatFeed, repeatFeed]

    share({ name, secret, quorum, recps }, (err, data) => {
      t.ok(err, 'raises error')
      t.notOk(data, 'data is undefined')
      t.equal(err.message, 'data.recps: please provide unique feedIds', 'invalid feedId')

      server.close()
      next()
    })
  })

  test('invalid recps (self as recp)', (t, next) => {
    recps = [server.id]

    share({ name, secret, quorum, recps }, (err, data) => {
      t.ok(err, 'raises error')
      t.notOk(data, 'data is undefined')
      t.equal(err.message, `data.recps: can't include ${server.id}`, 'raises error when includes self')

      server.close()
      next()
    })
  })

  test('invalid quorum', (t, next) => {
    quorum = 0

    share({ name, secret, quorum, recps }, (err, data) => {
      t.ok(err, 'raises error')
      t.notOk(data, 'data is undefined')
      t.equal(err.message, 'data.quorum: must be greater than 0', 'invalid quorum')

      quorum = recps.length + 1

      share({ name, secret, quorum, recps }, (err, data) => {
        t.ok(err, 'raises error')
        t.notOk(data, 'data is undefined')
        t.equal(err.message, 'data.quorum: greater than number of recps', 'invalid quorum')

        server.close()
        next()
      })
    })
  })

  test('publishes a root, a ritual and the shards', (t, next) => {
    share({ name, secret, quorum, recps }, (err, data) => {
      t.notOk(err, 'error is null')
      t.ok(data, 'returns the data')

      const optsForType = (type) => {
        return { 
          query: [{
            $filter: { value: { content: { type } } }
          }]
        }
      }

      pull(
        server.query.read(optsForType('dark-crystal/root')),
        pull.collect((err, roots) => {
          t.deepEqual(data.root, roots[0], 'publishes a root')

          pull(
            server.query.read(optsForType('dark-crystal/ritual')),
            pull.collect((err, rituals) => {
              t.deepEqual(data.ritual, rituals[0], 'publishes a single ritual')

              pull(
                server.query.read(optsForType('dark-crystal/shards')),
                pull.collect((err, shards) => {
                  t.deepEqual(data.shards, shards, 'publishes a set of shards')

                  server.close()

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
