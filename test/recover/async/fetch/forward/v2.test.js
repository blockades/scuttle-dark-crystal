const { describe } = require('tape-plus')
const getContent = require('ssb-msg-content')

const Server = require('../../../../testbot')
const Fetch = require('../../../../../recover/async/fetch')
const buildData = require('../data-forward.v2.js')

describe('recover.async.fetch (v2 forward)', context => {
  // we've got a v1 root, ritual, shards,
  // and v1 requests, replies
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
      const { custodians, proposed, published } = data

      fetch(published.rootId, (err, data) => {
        assert.equal(err, null, 'no error')

        // USE THIS to generate v1.data.js :
        // console.log(JSON.stringify(data, null, 2))

        // data:
        //
        // {
        //   root: null,
        //   ritual: null,
        //   shardsData: [
        //     {
        //       feedId, // custodian A feedId
        //       shard: null,
        //       requestsData: []
        //       forwardsData: [
        //         { forward }
        //         // this data structure offers symmetry with requestsData
        //         // and might serve for future request-fwds
        //       ]
        //     },
        //     {
        //       feedId, // custodian B feedId
        //       shard: null,
        //       requestsData: []
        //       forwardsData: [
        //         { forward }
        //       ]
        //     }
        //   ]
        // }

        assert.equal(data.root, null, 'unknown root message')
        assert.equal(data.ritual, null, 'unknown ritual message')

        // shard + custodian 0
        var { feedId, shard, requestsData, forwardsData } = data.shardsData[0]
        assert.equal(feedId, custodians[0].id, 'correct feedId')
        assert.equal(shard, null, 'original shard message unknown')

        assert.deepEqual(requestsData, [], 'no requestsData')
        assert.deepEqual(getContent(forwardsData[0].forward), proposed.forwardPairs[0].forward, 'receive the forward from custodian A')

        // shard + custodian 1
        var { forwardsData: forwardsData1 } = data.shardsData[1]
        // ...
        assert.deepEqual(getContent(forwardsData1[0].forward), proposed.forwardPairs[1].forward, 'receive the forward from custodian B')

        // shard + custodian 2
        assert.equal(data.shardsData.length, 2, 'only 2 fwdd shards')

        next()
      })
    })
  })
})
