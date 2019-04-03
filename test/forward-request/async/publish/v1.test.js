const { describe } = require('tape-plus')
const getContent = require('ssb-msg-content')

const Publish = require('../../../../forward-request/async/publish')
const Server = require('../../../testbot')

describe('forwardRequest.async.publish', context => {
  let server
  let publish
  let secretOwner, recp

  context.beforeEach(c => {
    server = Server()
    publish = Publish(server)

    secretOwner = server.createFeed().id
    recp = server.createFeed().id
  })

  context.afterEach(c => {
    server.close()
  })

  context('publishes a message when valid', (assert, next) => {
    publish({ secretOwner, recp }, (err, forwardRequest) => {
      const publishedForwardRequest = getContent(forwardRequest)
      assert.notOk(err, 'null errors')
      assert.ok(forwardRequest, 'valid forward object')
      assert.equal('1.0.0', publishedForwardRequest.version, 'correct version')
      assert.equal(publishedForwardRequest.secretOwner, secretOwner, 'correct secretOwner')
      next()
    })
  })

  context('fails to publish when invalid', (assert, next) => {
    secretOwner = 'this is not a feedId'
    publish({ secretOwner, recp }, (err, forwardRequest) => {
      assert.ok(err, 'produces error')
      assert.notOk(forwardRequest, 'forward object is null')
      next()
    })
  })
})
