const { describe } = require('tape-plus')
const { isRequest } = require('ssb-dark-crystal-schema')

const Server = require('../../testbot')
const Share = require('../../../share/async/share')
const PublishRoot = require('../../../root/async/publish')
const Request = require('../../../recover/async/request')

describe('recover.async.request', context => {
  let server, share, request, publishRoot
  let recps, name, secret, quorum

  context.beforeEach(c => {
    server = Server()
    share = Share(server)
    request = Request(server)
    publishRoot = PublishRoot(server)

    recps = [
      server.createFeed().id,
      server.createFeed().id,
      server.createFeed().id
    ]

    name = 'My SBB Dark Crystal'
    secret = Math.random().toString(36)
    quorum = 3
  })

  context.afterEach(c => {
    server.close()
  })

  context('Publishes requests when given a rootId which has some related shards published', (assert, next) => {
    share({ name, secret, quorum, recps }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key
      request(rootId, (err, msgs) => {
console.log(JSON.stringify(msgs,null,4))
        assert.notOk(err, 'null errors')
        assert.ok(msgs, 'request messages')
        assert.equal(msgs.length, recps.length, 'publishes a request for each shard')
        assert.ok(msgs.every(isRequest), 'all messages are valid requests')
        next()
      })
    })
  })

  context('Publishes a single request when given a single recipient', (assert, next) => {
    share({ name, secret, quorum, recps }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key
      request(rootId, [recps[1]], (err, msgs) => {
        assert.notOk(err, 'null errors')
        assert.ok(msgs, 'invite message')
        assert.equal(msgs.length, 1, 'publishes a single message')
        assert.ok(msgs.every(isRequest), 'all messages are valid requests')
        next()
      })
    })
  })

  context('Publishes a multiple requests when given multiple recipients', (assert, next) => {
    share({ name, secret, quorum, recps }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key
      request(rootId, [recps[1], recps[2]], (err, msgs) => {
        assert.notOk(err, 'null errors')
        assert.ok(msgs, 'invite message')
        assert.equal(msgs.length, 2, 'publishes multiple messages')
        assert.ok(msgs.every(isRequest), 'all messages are valid requests')
        next()
      })
    })
  })

  context('Throws errors and publishes nothing when rootId is invalid', (assert, next) => {
    share({ name, secret, quorum, recps }, (err, data) => {
      if (err) console.error(err)
      var rootId = 'invalid rootId'
      request(rootId, (err, msgs) => {
        assert.ok(err, 'Throws errors')
        assert.notOk(msgs, 'Publishes nothing')
        next()
      })
    })
  })

  context('Publishes nothing when given a rootId which has no associated shards', (assert, next) => {
    publishRoot(name, (err, data) => {
      if (err) console.error(err)
      var rootId = data.key
      request(rootId, (err, msgs) => {
        assert.ok(err, 'Throws errors')
        assert.notOk(msgs, 'Publishes nothing')
        next()
      })
    })
  })
})
