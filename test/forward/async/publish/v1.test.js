const { describe } = require('tape-plus')
const { box } = require('ssb-keys')

const Publish = require('../../../../forward/async/publish')
const Server = require('../../../testbot')
const { share: shareV1 } = require('../../../../lib/secrets-wrapper/v1')

describe('forward.async.publish (v1 shard)', context => {
  let server
  let publish
  let alice, bob
  let root
  let shard, bobShard

  context.beforeEach(c => {
    server = Server()
    publish = Publish(server)

    alice = server.createFeed()
    bob = server.createFeed()
    root = '%g1gbRKarJT4au9De2r4aJ+MghFSAyQzjfVnnxtJNBBw=.sha256'
    shard = shareV1('my secret', 3, 2)[0]

    bobShard = {
      type: 'dark-crystal/shard',
      version: '1.0.0',
      root,
      shard: box(shard, [ server.id ]),
      recps: [server.id, bob.id]
    }
  })

  context.afterEach(c => {
    server.close()
  })

  context('publishes a message when valid', (assert, next) => {
    bob.publish(bobShard, (err, bobReply) => {
      if (err) console.error(err)
      publish(root, alice.id, (err, forward) => {
        assert.notOk(err, 'null errors')
        assert.ok(forward, 'valid forward object')
        assert.equal('1.0.0', forward.value.content.shardVersion, 'correct version')
        assert.equal(shard, forward.value.content.shard, 'shard is inserted')
        next()
      })
    })
  })

  context('fails to publish when invalid', (assert, next) => {
    root = 'this is not a root'
    publish(root, alice.id, (errs, forward) => {
      assert.ok(errs, 'has errors')
      assert.notOk(forward, 'forward is null')
      next()
    })
  })

  context('fails to publish when shard is forwarded to its author', (assert, next) => {
    bob.publish(bobShard, (err, bobReply) => {
      if (err) console.error(err)
      publish(root, bob.id, (err, forward) => {
        assert.ok(err, 'throws error')
        assert.notOk(forward, 'forward is null')
        next()
      })
    })
  })
})