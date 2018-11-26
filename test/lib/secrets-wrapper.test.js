const { SCHEMA_VERSION } = require('ssb-dark-crystal-schema')
const { describe } = require('tape-plus')

const secrets = require('../../lib/secrets-wrapper')

describe('secrets-wrapper', context => {
  let secret, numRecps, quorum

  context.beforeEach(c => {
    secret = Math.random().toString(36)
    numRecps = 5
    quorum = 3
  })

  context('secret can be reproduced from quorum of shards', (assert, next) => {
    try {
      const shards = secrets.share(secret, numRecps, quorum).slice(2)
      var result = secrets.combine(shards, SCHEMA_VERSION)
    } catch (err) {
      assert.notOk(err, 'does not throw an error')
    }
    assert.equal(result, secret, 'secret recovered')
    next()
  })
  context('secret cannot be reproduced from less than quorum of shards', (assert, next) => {
    try {
      const shards = secrets.share(secret, numRecps, quorum).slice(3)
      var result = secrets.combine(shards, SCHEMA_VERSION)
    } catch (err) {
      assert.ok(err, 'throws an error')
    }
    assert.notEqual(result, secret, 'secret not recovered')
    next()
  })
})