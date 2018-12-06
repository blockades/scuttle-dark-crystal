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

  let server, custodians
  let fetch
  let messages

  context.beforeEach(c => {
    server = Server()
    custodians = [
      server.createFeed(),
      server.createFeed(),
      server.createFeed()
    ]

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

    const shards = custodians.map(custodian => {
      return {
        type: 'dark-crystal/shard',
        version: '1.0.0',
        root: 'NEEDED!',
        shard: 'shardymcshardface=.box',
        recps: [custodian.id, server.id]
      }
    })

    const Request = (custodian) => {
      return {
        type: 'invite',
        version: '1',
        root: 'NEEDED!',
        body: 'hey ahhh .. can I has that back?',
        recps: [custodian.id, server.id]
      }
    }
    const Reply = (custodian, share) => {
      return {
        type: 'invite-reply',
        version: '1',
        root: 'NEEDED!',
        accept: true,
        body: share,
        branch: [ 'NEEDED!' ],
        recps: [custodian.id, server.id]
      }
    }
    const shares = shareV1('my treasure location', 3, 2)

    const requestPairs = [
      { feed: custodians[0], request: Request(custodians[0]), reply: null }, // no reply on this request
      { feed: custodians[1], request: Request(custodians[1]), reply: Reply(custodians[1], shares[1]) },
      { feed: custodians[2], request: Request(custodians[2]), reply: null },
      { feed: custodians[0], request: Request(custodians[0]), reply: Reply(custodians[0], shares[0]) }
    ]

    messages = { root, ritual, shards, requestPairs }
  })

  context.afterEach(c => {
    server.close()
  })

  context('gets needed parts', (assert, next) => {
    publishAll(server)(messages, (err, { root, ritual, shards, requestPairs }) => {
      // NOTE publishAll mutates the messages by adding root + branch info where needed
      if (err) throw err

      fetch(root.key, (err, data) => {
        assert.equal(err, null, 'no error')

        // USE THIS to generate v1.data.js :
        // console.log(JSON.stringify(data, null, 2))

        // data:
        //
        // {
        //   root,
        //   ritual,
        //   shards: [
        //     {
        //       feedId, // custodian 0 feedId
        //       shard,
        //       requests: [
        //         { request } // request with no reply
        //         { request, reply }, // later request paired with a reply
        //       ]
        //     },
        //     {
        //       feedId, // custodian 1 feedId
        //       shard,
        //       requests: [
        //         { request, reply }
        //       ]
        //     },
        //     {
        //       feedId, // custodian 2 feedId
        //       shard,
        //       requests: [
        //         { request }
        //       ]
        //     },
        //   ]
        // }

        assert.deepEqual(getContent(data.root), getContent(root), 'has root')
        assert.deepEqual(getContent(data.ritual), getContent(ritual), 'has ritual')

        // shard + custodian 0
        var { feedId, shard, requests } = data.shards[0]
        assert.equal(feedId, custodians[0].id, 'correct feedId')
        assert.deepEqual(getContent(shard), messages.shards[0], 'correct shard')

        assert.deepEqual(getContent(requests[0].request), messages.requestPairs[0].request, 'first request to custodian 0')
        assert.deepEqual(getContent(requests[0].reply), undefined, 'no reply to first request to custodian 0')

        assert.deepEqual(getContent(requests[1].request), messages.requestPairs[3].request, 'second request to custodian 0')
        assert.deepEqual(getContent(requests[1].reply), messages.requestPairs[3].reply, 'second request to custodian 0')

        // shard + custodian 1
        var { feedId: feedId1, shard: shard1, requests: requests1 } = data.shards[1]
        assert.equal(feedId1, custodians[1].id, 'correct feedId')
        assert.deepEqual(getContent(shard1), messages.shards[1], 'correct shard')

        assert.deepEqual(getContent(requests1[0].request), messages.requestPairs[1].request, 'first request to custodian 1')
        assert.deepEqual(getContent(requests1[0].reply), messages.requestPairs[1].reply, 'first request to custodian 1')

        // shard + custodian 2
        var { feedId: feedId2, shard: shard2, requests: requests2 } = data.shards[2]
        assert.equal(feedId2, custodians[2].id, 'correct feedId')
        assert.deepEqual(getContent(shard2), messages.shards[2], 'correct shard')

        assert.deepEqual(getContent(requests2[0].request), messages.requestPairs[2].request, 'request to custodian 2')
        assert.deepEqual(getContent(requests2[0].reply), undefined, 'no reply to request to custodian 2')

        next()
      })
    })
  })
})

function publishAll (server, custodians) {
  return function ({ root, ritual, shards, requestPairs }, cb) {
    if (!isRoot(root)) console.log('problem with root', isRoot.errors)

    server.publish(root, (err, root) => {
      if (err) return cb(err)

      // add root attribute to messages
      ritual.root = root.key
      shards.forEach(m => {
        m.root = root.key
      })

      requestPairs.forEach(r => {
        r.request.root = root.key
        if (r.reply) r.reply.root = root.key
      })

      pull(
        pull.values([ritual, ...shards]),
        pull.asyncMap(server.publish),
        pull.collect((err, [ ritual, ...shards ]) => {
          if (err) return cb(err)

          pull(
            pull.values(requestPairs),
            pull.asyncMap(({ feed, request, reply }, cb) => {
              server.publish(request, (err, request) => {
                if (err) return cb(err)

                if (!reply) return cb(null, { request })

                reply.branch = [ request.key ] // how invites point to what they're replying to
                feed.publish(reply, (err, reply) => {
                  if (err) return cb(err)
                  cb(null, { request, reply })
                })
              })
            }),
            pull.collect((err, requestPairs) => {
              if (err) return cb(err)

              // check all of these things are legit messages
              if (!isRoot(root)) throw new Error('not a root')
              if (!isRitual(ritual)) throw new Error('not a ritual')
              shards.forEach(shard => {
                if (!isShard(shard)) throw new Error('not a shard')
              })
              requestPairs.forEach(({ request, reply }) => {
                if (!isRequest(request)) throw new Error('not a request')
                if (reply) {
                  if (!isReply(reply, '1.0.0')) throw new Error('not a reply')
                }
              })

              cb(null, { root, ritual, shards, requestPairs })
            })
          )
        })
      )
    })
  }
}
