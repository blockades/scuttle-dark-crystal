const { describe } = require('tape-plus')
const { unbox } = require('ssb-keys')
const getContent = require('ssb-msg-content')

const Server = require('../../testbot')
const Share = require('../../../share/async/share')
const Request = require('../../../recover/async/request')
const Recombine = require('../../../recover/async/recombine')

describe('recombine.async.recombine', context => {
  let server, recombine, request, alice, bob, carol
  let shardHolders, name, secret, quorum, share

  context.beforeEach(c => {
    server = Server()
    recombine = Recombine(server)
    request = Request(server)
    share = Share(server)

    // we are holding some shards from alice, bob and carol
    alice = server.createFeed()
    bob = server.createFeed()
    carol = server.createFeed()

    shardHolders = [
      alice.id,
      bob.id,
      carol.id
    ]

    name = 'My SBB Dark Crystal'
    secret = Math.random().toString(36)
    quorum = 2
  })

  context.afterEach(c => {
    server.close()
  })

  context('Returns the recombined secret', (assert, next) => {
    var replies = {}
    share({ name, secret, quorum, recps: shardHolders }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key
      request(rootId, (err, inviteMsgs) => {
        if (err) console.error(err)
        inviteMsgs.forEach((inviteMsg) => {
          var inviteMsgContent = getContent(inviteMsg)
          var shardHolder = inviteMsgContent.recps.filter(recp => recp !== server.id)[0]
          var shardMsgs = data.shards.map(s => (getContent(s)))
          var shard = shardMsgs.filter(s => (s.recps.find(r => (r === shardHolder))))[0].shard
          // We need to recreate replies from alice, and bob:
          const reply = {
            type: 'invite-reply',
            root: rootId,
            branch: inviteMsg.key,
            accept: true,
            version: '1',
            recps: inviteMsgContent.recps
          }
          if (shardHolder === alice.id) {
            reply.body = unbox(shard, alice.keys)
            replies['alice'] = reply
          }
          if (shardHolder === bob.id) {
            reply.body = unbox(shard, bob.keys)
            replies['bob'] = reply
          }
        })

        alice.publish(replies.alice, (err, aliceReply) => {
          if (err) console.error(err)
          bob.publish(replies.bob, (err, bobReply) => {
            if (err) console.error(err)

            recombine(rootId, (err, returnedSecret) => {
              assert.notOk(err, 'error is null')
              assert.equal(secret, returnedSecret, 'returns the correct secret')
              next()
            })
          })
        })
      })
    })
  })

  context('Throws an error if quorum is not reached', (assert, next) => {
    var replies = {}
    share({ name, secret, quorum, recps: shardHolders }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key
      request(rootId, (err, inviteMsgs) => {
        if (err) console.error(err)
        inviteMsgs.forEach((inviteMsg) => {
          var inviteMsgContent = getContent(inviteMsg)
          var shardHolder = inviteMsgContent.recps.filter(recp => recp !== server.id)[0]
          var shardMsgs = data.shards.map(s => (getContent(s)))
          var shard = shardMsgs.filter(s => (s.recps.find(r => (r === shardHolder))))[0].shard
          const reply = {
            type: 'invite-reply',
            root: rootId,
            branch: inviteMsg.key,
            accept: true,
            version: '1',
            recps: inviteMsgContent.recps
          }
          if (shardHolder === alice.id) {
            reply.body = unbox(shard, alice.keys)
            replies['alice'] = reply
          }
        })

        alice.publish(replies.alice, (err, aliceReply) => {
          if (err) console.error(err)
          recombine(rootId, (err, returnedSecret) => {
            assert.ok(err, 'Throws an error')
            assert.notOk(returnedSecret, 'Does not return a secret')
            next()
          })
        })
      })
    })
  })

  context('Throws an error and returns no secret if an invalid shard is found', (assert, next) => {
    var replies = {}
    share({ name, secret, quorum, recps: shardHolders }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key
      request(rootId, (err, inviteMsgs) => {
        if (err) console.error(err)
        inviteMsgs.forEach((inviteMsg) => {
          var inviteMsgContent = getContent(inviteMsg)
          var shardHolder = inviteMsgContent.recps.filter(recp => recp !== server.id)[0]
          var shardMsgs = data.shards.map(s => (getContent(s)))
          var shard = shardMsgs.filter(s => (s.recps.find(r => (r === shardHolder))))[0].shard
          // We need to recreate replies from alice, and bob:
          var reply = {
            type: 'invite-reply',
            root: rootId,
            branch: inviteMsg.key,
            accept: true,
            version: '1',
            recps: inviteMsgContent.recps
          }
          if (shardHolder === alice.id) {
            reply.body = unbox(shard, alice.keys)
            replies['alice'] = reply
          }
          if (shardHolder === bob.id) {
            reply.body = 'This is not a shard'
            replies['bob'] = reply
          }
        })

        alice.publish(replies.alice, (err, aliceReply) => {
          if (err) console.error(err)
          bob.publish(replies.bob, (err, bobReply) => {
            if (err) console.error(err)

            recombine(rootId, (err, returnedSecret) => {
              assert.ok(err, 'Throws an error')
              assert.notOk(returnedSecret, 'Does not return a secret')
              next()
            })
          })
        })
      })
    })
  })

  context('Throws an error and returns no secret when reply refers to the wrong root message', (assert, next) => {
    var replies = {}
    share({ name, secret, quorum, recps: shardHolders }, (err, data) => {
      if (err) console.error(err)
      share({ name, secret: 'another secret', quorum, recps: shardHolders }, (err, otherData) => {
        if (err) console.error(err)
        var rootId = data.root.key
        request(rootId, (err, inviteMsgs) => {
          if (err) console.error(err)
          inviteMsgs.forEach((inviteMsg) => {
            var inviteMsgContent = getContent(inviteMsg)
            var shardHolder = inviteMsgContent.recps.filter(recp => recp !== server.id)[0]
            var shardMsgs = data.shards.map(s => (getContent(s)))
            var shard = shardMsgs.filter(s => (s.recps.find(r => (r === shardHolder))))[0].shard
            // We need to recreate replies from alice, and bob:
            var reply = {
              type: 'invite-reply',
              root: otherData.root.key,
              branch: inviteMsg.key,
              accept: true,
              version: '1',
              recps: inviteMsgContent.recps
            }
            if (shardHolder === alice.id) {
              reply.body = unbox(shard, alice.keys)
              replies['alice'] = reply
            }
            if (shardHolder === bob.id) {
              reply.body = unbox(shard, bob.keys)
              replies['bob'] = reply
            }
          })

          alice.publish(replies.alice, (err, aliceReply) => {
            if (err) console.error(err)
            bob.publish(replies.bob, (err, bobReply) => {
              if (err) console.error(err)

              recombine(rootId, (err, returnedSecret) => {
                assert.ok(err, 'Throws an error')
                assert.notOk(returnedSecret, 'Does not return a secret')
                next()
              })
            })
          })
        })
      })
    })
  })

  context('Throws an error when given a rootId for which there is no root message', (assert, next) => {
    const rootId = '%g1gbRKarJT4au9De2r4aJ+MghFSAyQzjfVnnxtJNBBw=.sha256'
    recombine(rootId, (err, returnedSecret) => {
      assert.ok(err, 'Throws an error')
      assert.notOk(returnedSecret, 'Does not return a secret')
      next()
    })
  })
})
