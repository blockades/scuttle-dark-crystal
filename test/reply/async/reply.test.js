const { describe } = require('tape-plus')
const Server = require('../../testbot')
const { box } = require('ssb-keys')

const Reply = require('../../../reply/async/reply')
const pull = require('pull-stream')

describe('reply.async.reply', context => {
  let server, reply, katie
  let rootId, katiesInvite, katiesShard

  context.beforeEach(c => {
    server = Server()
    reply = Reply(server)
    katie = server.createFeed()

    rootId = '%g1gbRKarJT4au9De2r4aJ+MghFSAyQzjfVnnxtJNBBw=.sha256'

    katiesInvite = {
      type: 'invite',
      root: rootId,
      body: 'Hi you\'ve been holding a shard for me, can I please have it back?',
      version: 'v1',
      recps: [katie.id,server.id]
    }

    katiesShard = { 
      type: 'dark-crystal/shard',
      version: '1.0.0',
      root: rootId,
      shard: box('imagine this is a shard', [server.id]),
      recps: [katie.id, server.id] 
    }
  })

  context.afterEach(c => {
    server.close()
  })

  context('Publishes a reply', (assert, next) => {
    katie.publish(katiesShard, (err, shardMsg) => {
      if (err) throw err
      katie.publish(katiesInvite, (err, inviteMsg) => {
        if (err) throw err
        reply(inviteMsg.key, (err, replyMsg) => {
          assert.notOk(err, 'null errors')
          assert.ok(replyMsg, 'returns a reply message')
          next()
        })
      })
    })
  })

  context('Throws error if associated shard does not exist', (assert, next) => {
    katie.publish(katiesInvite, (err, inviteMsg) => {
      if (err) throw err
      reply(inviteMsg.key, (err,replyMsg) => {
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
