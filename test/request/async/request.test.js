
const { describe } = require('tape-plus')
const Server = require('../../testbot')
const Share = require('../../../share/async/share')

const Request = require('../../../request/async/request')

describe('request.async.request', context => {
  let server, share, request

  context.beforeEach(c => {
    server = Server()
    share = Share(server)
    request = Request(server)
      
    recps = [
      server.createFeed().id,
      server.createFeed().id,
      server.createFeed().id
    ]
    name = 'My SBB Dark Crystal'
    secret = Math.random().toString(36)
    quorum = 3

    })

  context.afterEach(c => {
    server.close()
  })

  context('Publishes requests when given a rootId which has some related shards published', (assert, next) => {
    share({ name, secret, quorum, recps }, (err, data) => { 
      var rootId = data.ritual.root
      
      request(rootId, (err,msgs) => {
        assert.notOk(err, 'null errors')
        assert.ok(msgs, 'invites messages')
        console.log(msgs)
      })
    })
    
  })

})
