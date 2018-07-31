const { describe } = require('tape-plus')
const Server = require('../../testbot')
const { box, unbox } = require('ssb-keys')
const getContent = require('ssb-msg-content')
const pull = require('pull-stream')
const Request = require('../../../request/async/request')
const Share = require('../../../share/async/share')

const Recombine = require('../../../recombine/async/recombine')

describe('recombine.async.recombine', context => {
  let server, recombine, request, alice, bob, carol 
  let shardHolders,name, secret,quorum, share

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
        inviteMsgs.forEach((inviteMsg) => {
          var inviteMsgContent = getContent(inviteMsg)
          var shardHolder = inviteMsgContent.recps.filter(recp => recp != server.id)[0]
          var shardMsgs = data.shards.map(s => (getContent(s)))
          var shard = shardMsgs.filter(s => (s.recps.find(r => (r === shardHolder))))[0].shard 
          // We need to recreate replies from alice, and bob: 
          reply = {
            type: 'invite-reply',
            root: rootId,
            branch: inviteMsg.key,
            accept: true,
            version: 'v1',
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

        
        alice.publish(replies.alice, (err,aliceReply) => {
          if (err) console.error(err)
          bob.publish(replies.bob, (err,bobReply) => {
            if (err) console.error(err)
          
            recombine(rootId, (err,returnedSecret) => {
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
        inviteMsgs.forEach((inviteMsg) => {
          var inviteMsgContent = getContent(inviteMsg)
          var shardHolder = inviteMsgContent.recps.filter(recp => recp != server.id)[0]
          var shardMsgs = data.shards.map(s => (getContent(s)))
          var shard = shardMsgs.filter(s => (s.recps.find(r => (r === shardHolder))))[0].shard 
          reply = {
            type: 'invite-reply',
            root: rootId,
            branch: inviteMsg.key,
            accept: true,
            version: 'v1',
            recps: inviteMsgContent.recps
          }
          if (shardHolder === alice.id) {
            reply.body = unbox(shard, alice.keys)
            replies['alice'] = reply
          }
        })

        
        alice.publish(replies.alice, (err,aliceReply) => {
          if (err) console.error(err)
          recombine(rootId, (err,returnedSecret) => {
            assert.ok(err, 'Throws an error')
            assert.notOk(returnedSecret, 'Does not return a secret')
            next()
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
        inviteMsgs.forEach((inviteMsg) => {
          var inviteMsgContent = getContent(inviteMsg)
          var shardHolder = inviteMsgContent.recps.filter(recp => recp != server.id)[0]
          var shardMsgs = data.shards.map(s => (getContent(s)))
          var shard = shardMsgs.filter(s => (s.recps.find(r => (r === shardHolder))))[0].shard 
          // We need to recreate replies from alice, and bob: 
          reply = {
            type: 'invite-reply',
            root: rootId,
            branch: inviteMsg.key,
            accept: true,
            version: 'v1',
            recps: inviteMsgContent.recps
          }
          if (shardHolder === alice.id) {
            reply.body = unbox(shard, alice.keys)
            replies['alice'] = reply
          }
        })

        
        alice.publish(replies.alice, (err,aliceReply) => {
          if (err) console.error(err)
          recombine(rootId, (err,returnedSecret) => {
            assert.ok(err, 'Throws an error')
            assert.notOk(returnedSecret, 'Does not return a secret')
            next()
          }) 
        })
      })
    })
  })
})
