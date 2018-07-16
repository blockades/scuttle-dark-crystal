const fs = require('fs')
const { describe } = require('tape-plus')
const Server = require('scuttle-testbot')

const Share = require('../../../share/async/share')

describe('share.async.share', context => {
  let server

  context.beforeEach(c => {
    server = Server()
    share = Share(server)
  })

  context.afterEach(c => {
    server.close()
  })

  context('with an existing root message', assert => {

  })

  context('without an existing root message', assert => {

  })
})
