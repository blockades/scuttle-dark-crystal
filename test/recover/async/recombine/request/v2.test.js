const { describe } = require('tape-plus')
const { unbox } = require('ssb-keys')
const getContent = require('ssb-msg-content')
const pull = require('pull-stream')

const Server = require('../../../../testbot')
const Share = require('../../../../../share/async/share')
const Request = require('../../../../../recover/async/request')
const Recombine = require('../../../../../recover/async/recombine')

// mix: These tests may be redundent as recombine is now "fetch" + "mend" which are each tested
// left in place because they still pass and don't (currently) cost anything

describe('recover.async.recombine (request v2 shards)', context => {
  let server, recombine, request, alice, bob, carol
  let custodians, name, secret, quorum, share, label

  context.beforeEach(c => {
    server = Server()
    recombine = Recombine(server)
    request = Request(server)
    share = Share(server)

    alice = server.createFeed()
    bob = server.createFeed()
    carol = server.createFeed()

    name = 'My SSB Dark Crystal'
    label = 'Give this key to your nearest and dearest'
    secret = Math.random().toString(36)
    custodians = [alice, bob, carol]
    quorum = 2
  })

  context.afterEach(c => {
    server.close()
  })

  context('Returns the recombined secret', (assert, next) => {
    share({ name, secret, quorum, label, recps: custodians.map(id) }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key

      request(rootId, (err, invites) => {
        if (err) console.error(err)
        buildReplies(invites, data, rootId, (err, replies) => {
          if (err) console.error(err)
          alice.publish(replies[alice.id], (err, aliceReply) => {
            if (err) console.error(err)
            bob.publish(replies[bob.id], (err, bobReply) => {
              if (err) console.error(err)
              recombine(rootId, (err, returnedSecret) => {
                assert.notOk(err, 'error is null')
                assert.equal(secret, returnedSecret.secret, 'returns the correct secret')
                assert.equal(label, returnedSecret.label, 'returns the correct label')
                next()
              })
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
        buildReplies(invites, data, rootId, (err, replies) => {
          if (err) console.error(err)
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
  })

  context('calls back with an error and returns no secret if an invalid shard is found', (assert, next) => {
    share({ name, secret, quorum, recps: custodians.map(id) }, (err, data) => {
      if (err) console.error(err)

      var rootId = data.root.key
      request(rootId, (err, invites) => {
        if (err) console.error(err)

        // var replies = invites.reduce((collection, invite) => {
        //   var content = getContent(invite)
        //   var custodianId = content.recps.find(notMe)
        //
        //   collection[custodianId] = {
        //     type: 'invite-reply',
        //     root: rootId,
        //     branch: invite.key,
        //     accept: true,
        //     version: '1',
        //     body: 'This is not a valid shard',
        //     recps: content.recps
        //   }
        //
        //   return collection
        // }, {})

        buildReplies(invites, data, rootId, (err, replies) => {
          if (err) console.error(err)
          replies[alice.id].body = 'This is not a valid share'
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

          buildReplies(invites, data, otherRootId, (err, replies) => {
            if (err) console.error(err)
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
  })

  context('calls back with an error and returns no secret if a reply message has wrong version', (assert, next) => {
    share({ name, secret, quorum, recps: custodians.map(id) }, (err, data) => {
      if (err) console.error(err)
      var rootId = data.root.key

      request(rootId, (err, invites) => {
        if (err) console.error(err)

        buildReplies(invites, data, rootId, (err, replies) => {
          if (err) console.error(err)

          replies[alice.id].shareVersion = '1111.0.0'

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

  function buildReplies (invites, data, rootId, cb) {
    pull(
      pull.values(invites),
      pull.asyncMap((invite, callback) => {
        var content = getContent(invite)
        var custodianId = content.recps.find(notMe)
        var shard = data.shards.map(getContent)
          .find(shard => shard.recps.find(recp => recp === custodianId))
          .shard

        const unboxedShare = unbox(shard, findCustodian(custodianId).keys)
        const contextMessage = { rootId, recp: custodianId }
        server.ephemeral.boxMessage(unboxedShare, content.ephPublicKey, contextMessage, (err, boxedShare) => {
          if (err) cb(err)
          callback(null,
            { custodianId,
              reply: {
                type: 'invite-reply',
                root: rootId,
                branch: invite.key,
                accept: true,
                version: '1',
                shareVersion: '2.0.0',
                body: boxedShare,
                recps: content.recps
              }
            }
          )
        })
      }),
      pull.collect((err, repliesArray) => {
        if (err) cb(err)
        var replies = {}
        repliesArray.forEach(reply => {
          replies[reply.custodianId] = reply.reply
        })
        cb(null, replies)
      })
    )
  }
})
