const pull = require('pull-stream')
const createShares = require('../../../../lib/secrets-wrapper/v2').share

const isForward = require('../../../../isForward')

// WARNING - with older versions of scuttlebot, this publishes messages publicly
// with newer sbot anything with recps will be auto-published privately
// (I think, might need to check out testbot feed publishing works)

const QUORUM = 2
module.exports = function publishV1Data (server) {
  return function (cb) {
    const custodians = [
      server.createFeed(), // piet
      server.createFeed(), // katie
      server.createFeed() //  alanna
    ]

    const proposed = buildProposed(server, custodians)
    // note these get mutated a little later with root + branch attributes

    publishAll(server)(proposed, (err, data) => {
      if (err) return cb(err)
      cb(null, { custodians, proposed, published: data })
    })
  }
}

function buildProposed (server, custodians) {
  if (QUORUM > custodians.length) throw new Error('test broken')
  const shares = createShares('my treasure location', custodians.length, QUORUM)

  // NOTE - this is the complicated strucute you need to understand.
  // The request / reply are paired because replies need to point back to the associated request

  const forwardPairs = shares
    .slice(0, QUORUM)
    .map((share, i) => {
      return {
        feed: custodians[i],
        forward: Forward(custodians[i], share)
      }
    })

  function Forward (custodian, share) {
    return {
      type: 'dark-crystal/forward',
      version: '2.0.0',
      root: 'NEEDED!!!!', // added later
      shard: share,
      shardVersion: '2.0.0',
      recps: [custodian.id, server.id]
    }
  }

  const root = {
    type: 'unknown',
    body: 'you should not be reading this, we don\'t know anything about the root message here',
    recps: ['@+oaWWDs8g73EZFUMfW37R/ULtFEjwKN/DczvdYihjbU=.ed25519'] // old me!
  }

  return { root, forwardPairs }
}

function publishAll (server) {
  return function ({ root, forwardPairs }, cb) {
    server.private.publish(root, root.recps, (err, root) => {
      if (err) throw new Error('ARGG, should have published?!')

      pull(
        pull.values(forwardPairs),
        pull.asyncMap(({ feed, forward }, cb) => {
          forward.root = root.key

          feed.publish(forward, (err, reply) => {
            if (err) return cb(err)
            cb(null, forward)
          })
        }),
        pull.collect((err, forwards) => {
          if (err) return cb(err)

          // check all of these things are legit messages
          forwards.forEach(f => {
            if (!isForward(f)) throw new Error('not a forward')
          })

          cb(null, { rootId: root.key, forwards })
        })
      )
    })
  }
}
