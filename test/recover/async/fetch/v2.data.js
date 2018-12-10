const pull = require('pull-stream')
const createShares = require('../../../../lib/secrets-wrapper/v2').share

const isRoot = require('../../../../isRoot')
const isRitual = require('../../../../isRitual')
const isShard = require('../../../../isShard')
const isRequest = require('../../../../isRequest')
const isReply = require('../../../../isReply')

// WARNING - with older versions of scuttlebot, this publishes messages publicly
// with newer sbot anything with recps will be auto-published privately
// (I think, might need to check out testbot feed publishing works)

module.exports = function publishV1Data (server) {
  return function (cb) {
    const custodians = [
      server.createFeed(), // piet
      server.createFeed(), // katie
      server.createFeed() //  alanna
    ]

    const proposed = buildProposed(server, custodians)
    // note these get mutated a little later with root + branch attributes

    publishAll(server)(proposed, (err, published) => {
      if (err) cb(err)
      else cb(null, { custodians, proposed, published })
    })
  }
}

function buildProposed (server, custodians) {
  const root = {
    type: 'dark-crystal/root',
    version: '2.0.0',
    name: 'my treasure',
    recps: [server.id]
  }

  const ritual = {
    type: 'dark-crystal/ritual',
    version: '2.0.0',
    root: 'NEEDED!',
    quorum: 3,
    shards: 2,
    tool: 'secrets.js-grempe@1.1.0', // TODO - remove
    recps: [server.id]
  }

  const shards = custodians.map(custodian => {
    return {
      type: 'dark-crystal/shard',
      version: '2.0.0',
      root: 'NEEDED!',
      shard: 'shardymcshardface=.box', // dummy as we're not testing reply generation logic
      recps: [custodian.id, server.id]
    }
  })

  const shares = createShares('my treasure location', 3, 2)

  // NOTE - this is the complicated strucute you need to understand.
  // The request / reply are paired because replies need to point back to the associated request
  const requestPairs = [
    { feed: custodians[0], request: Request(custodians[0]), reply: null }, // no reply on this request
    { feed: custodians[1], request: Request(custodians[1]), reply: Reply(custodians[1], shares[1]) },
    { feed: custodians[2], request: Request(custodians[2]), reply: null },
    { feed: custodians[0], request: Request(custodians[0]), reply: Reply(custodians[0], shares[0]) }
  ]
  function Request (custodian) {
    // TODO - this will need replyVersion in the future I think
    return {
      type: 'invite',
      version: '1',
      root: 'NEEDED!',
      body: 'hey ahhh .. can I has that back?',
      recps: [custodian.id, server.id]
    }
  }
  function Reply (custodian, share) {
    // TODO - this will need shardVersion and replyVersion in the future I think
    // TODO - currently returns "naked" shares - will need to change for ephemeral returns
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

  return { root, ritual, shards, requestPairs }
}

function publishAll (server) {
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
                  if (!isReply(reply, '2.0.0')) throw new Error('not a reply')
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
