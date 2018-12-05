const { describe } = require('tape-plus')
const { unbox } = require('ssb-keys')
const getContent = require('ssb-msg-content')

const Server = require('../../../testbot')
const Scuttle = require('../../../../') // for future can we specify a version in the require?

describe('recover.async.recombine (v1)', context => {
  let server, share, recombine, request
  let alice, bob, carol
  let name, secret, custodians, quorum

  context.beforeEach(c => {
    server = Server()
    var scuttle = Scuttle(server)
    share = scuttle.share.async.share
    recombine = scuttle.recover.async.recombine
    request = scuttle.recover.async.request

    alice = server.createFeed()
    bob = server.createFeed()
    carol = server.createFeed()

    custodians = [alice, bob, carol]

    name = 'My SBB Dark Crystal'
    secret = Math.random().toString(36)
    quorum = 2
  })

  context.afterEach(c => {
    server.close()
  })

  context('Returns the recombined secret', (assert, next) => {
    share({ name, secret, quorum, recps: custodians.map(id) }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key

      request(rootId, (err, invites) => {
        if (err) console.error(err)

        var replies = invites.reduce((collection, invite) => {
          var content = getContent(invite)
          var custodianId = content.recps.find(notMe)
          var shard = data.shards.map(getContent)
            .find(shard => shard.recps.find(recp => recp === custodianId))
            .shard

          collection[custodianId] = {
            type: 'invite-reply',
            root: rootId,
            branch: invite.key,
            accept: true,
            version: '1',
            body: unbox(shard, findCustodian(custodianId).keys),
            recps: content.recps
          }

          return collection
        }, {})

        alice.publish(replies[alice.id], (err, aliceReply) => {
          if (err) console.error(err)

          bob.publish(replies[bob.id], (err, bobReply) => {
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

  context('calls back with an error and returns no secret when reply refers to the wrong root message', (assert, next) => {
    share({ name, secret, quorum, recps: custodians.map(id) }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key

      share({ name, secret: 'another secret', quorum, recps: custodians.map(id) }, (err, otherData) => {
        if (err) console.error(err)
        var otherRootId = otherData.root.key

        request(rootId, (err, invites) => {
          if (err) console.error(err)

          var replies = invites.reduce((collection, invite) => {
            var content = getContent(invite)
            var custodianId = content.recps.find(notMe)
            var shard = data.shards.map(getContent)
              .find(shard => shard.recps.find(recp => recp === custodianId))
              .shard

            collection[custodianId] = {
              type: 'invite-reply',
              root: otherRootId,
              branch: invite.key,
              accept: true,
              version: '1',
              recps: content.recps,
              body: unbox(shard, findCustodian(custodianId).keys)
            }

            return collection
          }, {})

          alice.publish(replies[alice.id], (err, aliceReply) => {
            if (err) console.error(err)

            bob.publish(replies[bob.id], (err, bobReply) => {
              if (err) console.error(err)

              recombine(rootId, (err, returnedSecret) => {
                assert.ok(err, 'has erro')
                assert.notOk(returnedSecret, 'Does not return a secret')
                next()
              })
            })
          })
        })
      })
    })
  })

  context('calls back with an error when given a rootId for which there is no root message', (assert, next) => {
    const rootId = '%g1gbRKarJT4au9De2r4aJ+MghFSAyQzjfVnnxtJNBBw=.sha256'
    recombine(rootId, (err, returnedSecret) => {
      assert.ok(err, 'has error')
      assert.notOk(returnedSecret, 'Does not return a secret')
      next()
    })
  })

  function id (feed) {
    return feed.id
  }

  function notMe (recp) {
    return recp !== server.id
  }

  function findCustodian (custodianId) {
    return custodians.find(c => c.id === custodianId)
  }
})
