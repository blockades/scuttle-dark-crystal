const { describe } = require('tape-plus')
const Server = require('../../testbot')

const Publish = require('../../../forward/async/publish')

describe('forward.async.publish', context => {
  let server
  let publish
  let alice
  let root
  let shard

  context.beforeEach(c => {
    server = Server()
    publish = Publish(server)

    alice = server.createFeed()
    root = '%g1gbRKarJT4au9De2r4aJ+MghFSAyQzjfVnnxtJNBBw=.sha256'
    shard = 'imagine this is a shard'
  })

  context.afterEach(c => {
    server.close()
  })

  context('publishes a message when valid', (assert, next) => {
    publish(root, shard, alice.id, (err, forward) => {
      assert.notOk(err, 'null errors')
      assert.ok(forward, 'valid forward object')
      assert.equal(shard, forward.value.content.shard, 'shard is inserted')
      next()
    })
  })

  context('fails to publish when invalid', (assert, next) => {
    root = 'this is not a root'
    publish(root, shard, alice.id, (errs, forward) => {
      assert.ok(errs, 'has errors')
      assert.notOk(forward, 'forward is null')
      next()
    })
  })
})
