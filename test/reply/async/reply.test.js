const { describe } = require('tape-plus')
const Server = require('../../testbot')
const { box } = require('ssb-keys')

const Reply = require('../../../reply/async/reply')

describe('reply.async.reply', context => {
  let server, reply, katie
  let rootId, katiesInvite, katiesShard
  context.beforeEach(c => {
    server = Server()
    reply = Reply(server)
    katie = server.createFeed()

    rootId = '%g1gbRKarJT4au9De2r4aJ+MghFSAyQzjfVnnxtJNBBw=.sha256'
    
    // We need to recreate an invite from katie that looks a bit like this:
    katiesInvite = {
      type: 'invite',
      root: rootId,
      body: 'Hi you\'ve been holding a shard for me, can I please have it back?',
      version: 'v1' 
    }
    // and a shard with the same root id, which would look a bit like this:
    katiesShard = { 
      type: 'dark-crystal/shard',
      version: '1.0.0',
      root: rootId,
      shard: box('imagine this is a shard', [katie.id]),
      recps: [katie.id, server.id] 
    }

  })

  context.afterEach(c => {
    server.close()
  })

  context('Publishes a reply', (assert, next) => {

    // Im not sure if its better to use 'add' or 'publish'
    server.publish(katiesShard, (err,shardMsg)=> {
      if (err) console.error(error)
      server.publish(katiesInvite, (err,inviteMsg)=> {
        if (err) console.error(error)
        reply(inviteMsg.key, (err,replyMsg) => {
          console.log('callback reached!',replyMsg);
          assert.notOk(err, 'null errors')
          assert.ok(replyMsg, 'returns a reply message')
        })
      })
     })
    next()
  })


  context('Throws error and published nothing when given an invalid inviteId', (assert, next) => {
    reply('bad id', (err,replyMsg) => {
      assert.ok(err, 'Throws error')
      assert.notOk(replyMsg, 'data is undefined')
    })
    next()
  })
})
