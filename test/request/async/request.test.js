const { describe } = require('tape-plus')
const Server = require('../../testbot')
const Share = require('../../../share/async/share')
const PublishRoot = require('../../../root/async/publish')

const { isInvite } = require('ssb-invite-schema')

const Request = require('../../../request/async/request')

describe('request.async.request', context => {
  let server, share, request

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
      var rootId = data.root.key
      request(rootId, (err, msgs) => {
        assert.notOk(err, 'null errors')
        assert.ok(msgs, 'invites messages')
        assert.equal(msgs.length, recps.length, 'publishes a request for each shard')
        assert.ok(msgs.every(isInvite), 'all messages are valid invites')
        next()
      })
    })
  })

  context('Throws errors and publishes nothing when rootId is invalid', (assert, next) => {
    share({ name, secret, quorum, recps }, (err, data) => {
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
      var rootId = data.key
      request(rootId, (err, msgs) => {
        assert.ok(err, 'Throws errors')
        assert.notOk(msgs, 'Publishes nothing')
        next()
      })
    })
  })
})
