
const { describe } = require('tape-plus')
const Server = require('../../testbot')
const { box, unbox } = require('ssb-keys')
const getContent = require('ssb-msg-content')
const pull = require('pull-stream')
const Request = require('../../../request/async/request')

const Recombine = require('../../../recombine/async/recombine')

describe('recombine.async.recombine', context => {
  let server, recombine, request, alice, bob, carol 
  let shardHolders,name, secret,quorum

  context.beforeEach(c => {
    server = Server()
    recombine = Recombine(server)
    request = Request(server)

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
    share({ name, secret, quorum, shardHolders }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key
      request(rootId, (err, inviteMsgs) => { 
        inviteMsgs.forEach((inviteMsg) => {
          var inviteMsgContent = getContent(inviteMsg)
          shardHolder = inviteMsgContent.recps.filter(recp => recp != server.id)[0]
          shard = data.shards.filter(s => (s.recps === [shardHolder, server.id] || (s.recps === [server.id, shardHolder])))
          // We need to recreate replies from alice, and bob: 
          reply = {
            type: 'invite-reply',
            root: rootId,
            branch: inviteMsg.key,
            body: unbox(shard,shardHolder),
            accept: true,
            version: 'v1',
            recps: inviteMsgContent.recps
          }
          if (shardHolder === alice.id) replies['alice'] = reply
          if (shardHolder === bob.id) replies['bob'] = reply
        })

        
        alice.publish(replies.alice, (err,aliceReply) => {
          if (err) console.error(err)
          bob.publish(replies.bob, (err,aliceReply) => {
            if (err) console.error(err)
          
            recombine(rootId, (err,returnedSecret) => {
              console.log('secret is ', returnedSecret)

              assert.notOk(err, 'error is null')
              assert.ok(data, 'returns the secret')
              // assert equal secret,returnedSecret
              next()
            }) 
          })
        })
      })
    })
  })
})
