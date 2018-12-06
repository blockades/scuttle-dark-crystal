const { describe } = require('tape-plus')
const getContent = require('ssb-msg-content')

const Server = require('../../../testbot')
const Fetch = require('../../../../recover/async/fetch')

const buildData = require('./v1.data.js')

describe('recover.async.fetch (v1)', context => {
  // we've got a v1 root, ritual, shards, requests, replies
  // get them all and put them in an object

  let server
  let fetch

  context.beforeEach(c => {
    server = Server()

    fetch = Fetch(server)
  })

  context.afterEach(c => {
    server.close()
  })

  context('gets needed parts', (assert, next) => {
    buildData(server)((err, data) => {
      if (err) throw err
      const { custodians, proposed, published: { root } } = data

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

        assert.deepEqual(getContent(data.root), proposed.root, 'has root')
        assert.deepEqual(getContent(data.ritual), proposed.ritual, 'has ritual')

        // shard + custodian 0
        var { feedId, shard, requests } = data.shards[0]
        assert.equal(feedId, custodians[0].id, 'correct feedId')
        assert.deepEqual(getContent(shard), proposed.shards[0], 'correct shard')

        assert.deepEqual(getContent(requests[0].request), proposed.requestPairs[0].request, 'first request to custodian 0')
        assert.deepEqual(getContent(requests[0].reply), undefined, 'no reply to first request to custodian 0')

        assert.deepEqual(getContent(requests[1].request), proposed.requestPairs[3].request, 'second request to custodian 0')
        assert.deepEqual(getContent(requests[1].reply), proposed.requestPairs[3].reply, 'second request to custodian 0')

        // shard + custodian 1
        var { feedId: feedId1, shard: shard1, requests: requests1 } = data.shards[1]
        assert.equal(feedId1, custodians[1].id, 'correct feedId')
        assert.deepEqual(getContent(shard1), proposed.shards[1], 'correct shard')

        assert.deepEqual(getContent(requests1[0].request), proposed.requestPairs[1].request, 'first request to custodian 1')
        assert.deepEqual(getContent(requests1[0].reply), proposed.requestPairs[1].reply, 'first request to custodian 1')

        // shard + custodian 2
        var { feedId: feedId2, shard: shard2, requests: requests2 } = data.shards[2]
        assert.equal(feedId2, custodians[2].id, 'correct feedId')
        assert.deepEqual(getContent(shard2), proposed.shards[2], 'correct shard')

        assert.deepEqual(getContent(requests2[0].request), proposed.requestPairs[2].request, 'request to custodian 2')
        assert.deepEqual(getContent(requests2[0].reply), undefined, 'no reply to request to custodian 2')

        next()
      })
    })
  })
})

