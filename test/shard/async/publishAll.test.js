const { describe } = require('tape-plus')
const pull = require('pull-stream')
const Server = require('../../testbot')
const secrets = require('secrets.js-grempe')

const PublishAll = require('../../../shard/async/publishAll')

describe('shard.async.publishAll', context => {
  let server
  let publishAll
  let recps, secret, quorum, rootId
  let hexSecret,shards

  context.beforeEach(c => {
    server = Server()
    publishAll = PublishAll(server)
    recps = [
      server.createFeed().id,
      server.createFeed().id,
      server.createFeed().id
    ]
    secret = Math.random().toString(36)
    quorum = 3

    hexSecret = secrets.str2hex(secret)
    shards = secrets.share(hexSecret, recps.length, quorum)
  
    rootId = "%viiJnnnXjNkfCALivEZbrDe8UndkCCCNQ/CgBOWgJLw=.sha256"
  
  })

  context.afterEach(c => {
    server.close()
  })


  context('publishes all shards', (assert, next) => {
   
    publishAll({ shards, recps, rootId }, (err, data) => {
      assert.notOk(err, 'error is null')
      assert.ok(data, 'returns some data')
      // console.log(JSON.stringify(data,null,4)) 
      assert.equal(data.length, shards.length, 'publishes one message for each recipient')
      next()
    })
  })
})
