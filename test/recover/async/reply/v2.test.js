const { describe } = require('tape-plus')
const { box } = require('ssb-keys')

const Server = require('../../../testbot')
const Reply = require('../../../../recover/async/reply')
const isShard = require('../../../../isShard')
const isReply = require('../../../../isReply')
const { share } = require('../../../../lib/secrets-wrapper/v2')

describe('recover.async.reply (v2)', context => {
  let server, reply, katie
  let rootId, katiesInvite, katiesShard
  let ephPublicKey, dbKey

  context.beforeEach(c => {
    server = Server()
    reply = Reply(server)
    katie = server.createFeed()

    rootId = '%g1gbRKarJT4au9De2r4aJ+MghFSAyQzjfVnnxtJNBBw=.sha256'

    dbKey = { rootId, recp: server.id }

    katiesInvite = {
      type: 'invite',
      root: rootId,
      body: 'Hi you\'ve been holding a shard for me, can I please have it back?',
      version: '1',
      recps: [katie.id, server.id]
    }

    const shards = share('the treasure is under the old cabbage tree', 5, 2)

    katiesShard = {
      type: 'dark-crystal/shard',
      version: '2.0.0',
      root: rootId,
      shard: box(shards[0], [server.id]),
      recps: [katie.id, server.id]
    }
  })

  context.afterEach(c => {
    server.close()
  })

  context('Publishes a reply', (assert, next) => {
    assert.ok(isShard(katiesShard), 'is a v2 shard')
    // TODO - check it's a v1 invite?

    katie.publish(katiesShard, (err, shardMsg) => {
      if (err) throw err
      server.ephemeral.generateAndStore(dbKey, (err, ephPublicKey) => {
        if (err) throw err
        katiesInvite.ephPublicKey = ephPublicKey
        katie.publish(katiesInvite, (err, inviteMsg) => {
          if (err) throw err
          reply(inviteMsg.key, (err, replyMsg) => {
            assert.notOk(err, 'null errors')
            assert.ok(replyMsg, 'returns a reply message')
            assert.ok(isReply(replyMsg), 'message are valid replies')
            assert.equal(replyMsg.value.content.shareVersion,
              '2.0.0',
              'reply contains correct shareVersion')
            next()
          })
        })
      })
    })
  })
  // TODO: add generateAndStore to remaining tests
  context('Throws error if associated shard does not exist', (assert, next) => {
    katie.publish(katiesInvite, (err, inviteMsg) => {
      if (err) throw err
      reply(inviteMsg.key, (err, replyMsg) => {
        assert.ok(err, 'Throws error')
        assert.notOk(replyMsg, 'Does not return a reply message')
        next()
      })
    })
  })

  context('Throws error and published nothing when given an invalid inviteId', (assert, next) => {
    reply('bad id', (err, replyMsg) => {
      assert.ok(err, 'Throws error')
      assert.notOk(replyMsg, 'data is undefined')
    })
    next()
  })
})
