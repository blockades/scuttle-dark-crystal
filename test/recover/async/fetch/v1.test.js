const { describe } = require('tape-plus')
const pull = require('pull-stream')
const getContent = require('ssb-msg-content')

const Server = require('../../../testbot')
const Fetch = require('../../../../recover/async/fetch')
const shareV1 = require('../../../../lib/secrets-wrapper/v1').share

const isRoot = require('../../../../isRoot')
const isRitual = require('../../../../isRitual')
const isShard = require('../../../../isShard')
const isRequest = require('../../../../isRequest')
const isReply = require('../../../../isReply')

describe('recover.async.fetch (v1)', context => {
  // we've got a v1 root, ritual, shards, requests, replies
  // get them all and put them in an object

  let server, katie
  let fetch
  let messages

  context.beforeEach(c => {
    server = Server()
    katie = server.createFeed()

    fetch = Fetch(server)

    const root = {
      type: 'dark-crystal/root',
      version: '1.0.0',
      name: 'my treasure',
      recps: [server.id]
    }

    const ritual = {
      type: 'dark-crystal/ritual',
      version: '1.0.0',
      root: 'NEEDED!',
      quorum: 3,
      shards: 2,
      tool: 'secrets.js-grempe@1.1.0',
      recps: [server.id]
    }

    const shard = {
      type: 'dark-crystal/shard',
      version: '1.0.0',
      root: 'NEEDED!',
      shard: 'shardymcshardface=.box',
      recps: [katie.id, server.id]
    }

    const request1 = {
      type: 'invite',
      version: '1',
      root: 'NEEDED!',
      body: 'hey ahhh .. can I has that back?',
      recps: [katie.id, server.id]
    }

    const request2 = {
      type: 'invite',
      version: '1',
      root: 'NEEDED!',
      body: 'hey ahhh .. can I has that back?',
      recps: [katie.id, server.id]
    }

    const reply = {
      type: 'invite-reply',
      version: '1',
      root: 'NEEDED!',
      accept: true,
      body: shareV1('my treasure location', 3, 2)[0],
      branch: [ 'NEEDED!' ],
      recps: [katie.id, server.id]
    }
    // only first request has a reply

    messages = { root, ritual, shard, requests: [request1, request2], reply }
  })

  context.afterEach(c => {
    server.close()
  })

  context('gets needed parts', (assert, next) => {
    publishAll(server)(messages, (err, { root, ritual, shard, requests, reply }) => {
      if (err) throw err

      fetch(root.key, (err, data) => {
        assert.equal(err, null, 'no error')

        // data:
        //
        // {
        //   root,
        //   ritual,
        //   shards: [
        //     {
        //       feedId, // custodian feedId
        //       shard,
        //       requests: [
        //         { request, reply }, // reply paired with request
        //         { request } // second request (for ephemeral requests)
        //       ]
        //     },
        //     feedId: {
        //       ...
        //     }
        //   ]
        // }

        assert.deepEqual(getContent(data.root), getContent(root), 'has root')
        assert.deepEqual(getContent(data.ritual), getContent(ritual), 'has ritual')

        assert.equal(data.shards[0].feedId, katie.id, 'shards[0].feedId correct')
        assert.deepEqual(getContent(data.shards[0].shard), getContent(shard), 'shards[0].shard correct')

        assert.deepEqual(getContent(data.shards[0].requests[0].request), getContent(requests[0]), 'shards[0].requests[0].request correct')
        assert.deepEqual(getContent(data.shards[0].requests[0].reply), getContent(reply), 'shards[0].requests[0].reply correct')

        assert.deepEqual(getContent(data.shards[0].requests[1].request), getContent(requests[1]), 'shards[0].requests[1].request correct')
        assert.deepEqual(getContent(data.shards[0].requests[1].reply), undefined, 'shards[0].requests[1].reply is empty')

        next()
      })
    })
  })
})

function publishAll (server) {
  return function ({ root, ritual, shard, requests, reply }, cb) {
    if (!isRoot(root)) console.log('problem with root', isRoot.errors)

    server.publish(root, (err, root) => {
      if (err) return cb(err)

      ritual.root = root.key
      shard.root = root.key
      requests.forEach(r => { r.root = root.key })
      reply.root = root.key

      pull(
        pull.values([ritual, shard, ...requests]),
        pull.asyncMap(server.publish),
        pull.collect((err, [ ritual, shard, request1, request2 ]) => {
          if (err) return cb(err)

          reply.branch = [ request1.key ]

          server.publish(reply, (err, reply) => {
            if (err) return cb(err)

            if (!isRoot(root)) throw new Error('not a root')
            if (!isRitual(ritual)) throw new Error('not a ritual')
            if (!isShard(shard)) throw new Error('not a shard')
            if (!isRequest(request1)) throw new Error('not a request')
            if (!isRequest(request2)) throw new Error('not a request')
            if (!isReply(reply, '1.0.0')) throw new Error('not a reply')

            cb(null, { root, ritual, shard, requests: [request1, request2], reply })
          })
        })
      )
    })
  }
}
