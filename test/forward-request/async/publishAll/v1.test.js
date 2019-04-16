const { describe } = require('tape-plus')
const { isForwardRequest } = require('ssb-dark-crystal-schema')
const getContent = require('ssb-msg-content')

const PublishAll = require('../../../../forward-request/async/publish-all')
const Server = require('../../../testbot')

describe('forwardRequest.async.publish', context => {
  let server
  let publishAll
  let secretOwner, recps

  context.beforeEach(c => {
    server = Server()
    publishAll = PublishAll(server)

    secretOwner = server.createFeed().id
    recps = [
      server.createFeed().id,
      server.createFeed().id,
      server.createFeed().id
    ]
  })

  context.afterEach(c => {
    server.close()
  })

  context('publishes a message when valid', (assert, next) => {
    publishAll({ secretOwner, recps }, (err, forwardRequests) => {
      assert.notOk(err, 'null errors')
      assert.ok(Array.isArray(forwardRequests), 'returns some data')
      assert.equal(forwardRequests.length, recps.length, 'publishes one message for each recipient')

      forwardRequests.forEach(forwardRequest => {
        assert.ok(isForwardRequest(forwardRequest), 'valid forward request')
        assert.equal(getContent(forwardRequest).secretOwner, secretOwner, 'correct secretOwner')
      })
      next()
    })
  })

  context('fails to publish all with invalid secretOwner', (assert, next) => {
    secretOwner = 'this is not a feedId'

    publishAll({ secretOwner, recps }, (err, forwardRequests) => {
      assert.ok(err, 'produces error')
      assert.notOk(forwardRequests, 'forward object is null')
      next()
    })
  })

  context('fails to publish all with single invalid recp', (assert, next) => {
    recps[0] = 'this is not a feedId'

    publishAll({ secretOwner, recps }, (err, recipients) => {
      assert.ok(err, 'produces error')
      assert.equal(recps, recipients, 'returns invalid recps')
      next()
    })
  })
})
