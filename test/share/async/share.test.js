const { describe } = require('tape-plus')
const Server = require('scuttle-testbot')

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
    name = "Dark Crystal"
    secret = Math.random().toString(36)
    quorum = 3
  })

  context.afterEach(c => {
    server.close()
  })

  context('takes a specific set of arguments', assert => {
    assert.equal(2, share.length, 'takes two arguments')
  })

  context('validates the params', assert => {
    assert.throws(() => share({ secret, quorum, recps }, () => {}), 'throws an error when name is missing')
    assert.throws(() => share({ name, quorum, recps }, () => {}), 'throws an error when secret is missing')
    assert.throws(() => share({ name, secret, recps }, () => {}), 'throws an error when quorum is missing')
    assert.throws(() => share({ name, secret, quorum }, () => {}), 'throws an error when recps is missing')
    assert.throws(() => share({ name, secret, quorum, recps }), 'throws an error when callback is missing')
    assert.throws(() => share({ name, secret, quorum, recps }, 'not a callback'), 'throws an error when callback is not a function')
  })

  context('validates recps', (assert, next) => {
    recps = ['thisisnotafeed']
    share({ name, secret, quorum, recps }, (err, data) => {
      assert.ok(err, 'raises error')
      assert.notOk(data, 'data is undefined')
      assert.equal(err.message, 'data.recps: must be a feedId', 'invalid feedId')

      recps = [server.id]
      share({ name, secret, quorum, recps }, (err, data) => {
        assert.ok(err, 'raises error')
        assert.notOk(data, 'data is undefined')
        assert.equal(err.message, `data.recps: can't include ${server.id}`, 'raises error when includes self')
        next()
      })
    })
  })

  context('validates quorum', (assert, next) => {
    quorum = 0
    share({ name, secret, quorum, recps }, (err, data) => {
      assert.ok(err)
      assert.notOk(data, 'data is undefined')
      assert.equal(err.message, 'data.quorum: must be greater than 0', 'invalid quorum')

      quorum = recps.length + 1

      share({ name, secret, quorum, recps }, (err, data) => {
        assert.ok(err)
        assert.notOk(data, 'data is undefined')
        assert.equal(err.message, 'data.quorum: greater than number of recps', 'invalid quorum')

        next()
      })
    })
  })
})
