const { describe } = require('tape-plus')
const { unbox } = require('ssb-keys')
const getContent = require('ssb-msg-content')

const Server = require('../../../testbot')
const Share = require('../../../../share/async/share')
const Request = require('../../../../recover/async/request')
const Recombine = require('../../../../recover/async/recombine')

// mix: These tests may be redundent as recombine is now "fetch" + "mend" which are each tested
// left in place because they still pass and don't (currently) cost anything

describe('recover.async.recombine (with v2 shards)', context => {
  let server, recombine, request, alice, bob, carol
  let custodians, name, secret, quorum, share

  context.beforeEach(c => {
    server = Server()
    recombine = Recombine(server)
    request = Request(server)
    share = Share(server)

    alice = server.createFeed()
    bob = server.createFeed()
    carol = server.createFeed()

    name = 'My SBB Dark Crystal'
    secret = Math.random().toString(36)
    custodians = [alice, bob, carol]
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
          return buildReplies(collection, invite, data, rootId)
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

  context('calls back with an error if quorum is not reached', (assert, next) => {
    share({ name, secret, quorum, recps: custodians.map(id) }, (err, data) => {
      if (err) console.error(err)

      var rootId = data.root.key
      request(rootId, (err, invites) => {
        if (err) console.error(err)

        var replies = invites.reduce((collection, invite) => {
          return buildReplies(collection, invite, data, rootId)
        }, {})

        alice.publish(replies[alice.id], (err, aliceReply) => {
          if (err) console.error(err)

          recombine(rootId, (err, returnedSecret) => {
            assert.ok(err, 'an error')
            assert.notOk(returnedSecret, 'Does not return a secret')
            next()
          })
        })
      })
    })
  })

  context('calls back with an error and returns no secret if an invalid shard is found', (assert, next) => {
    share({ name, secret, quorum, recps: custodians.map(id) }, (err, data) => {
      if (err) console.error(err)

      var rootId = data.root.key
      request(rootId, (err, invites) => {
        if (err) console.error(err)

        var replies = invites.reduce((collection, invite) => {
          var content = getContent(invite)
          var custodianId = content.recps.find(notMe)

          collection[custodianId] = {
            type: 'invite-reply',
            root: rootId,
            branch: invite.key,
            accept: true,
            version: '1',
            body: 'This is not a valid shard',
            recps: content.recps
          }

          return collection
        }, {})

        alice.publish(replies[alice.id], (err, aliceReply) => {
          if (err) console.error(err)

          bob.publish(replies[bob.id], (err, bobReply) => {
            if (err) console.error(err)

            recombine(rootId, (err, returnedSecret) => {
              assert.ok(err, 'an error')
              assert.notOk(returnedSecret, 'Does not return a secret')
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
            return buildReplies(collection, invite, data, otherRootId)
          }, {})

          alice.publish(replies[alice.keys.id], (err, aliceReply) => {
            if (err) console.error(err)

            bob.publish(replies[bob.keys.id], (err, bobReply) => {
              if (err) console.error(err)

              recombine(rootId, (err, returnedSecret) => {
                assert.ok(err, 'an error')
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

  function buildReplies (collection, invite, data, rootId) {
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
  }
})
