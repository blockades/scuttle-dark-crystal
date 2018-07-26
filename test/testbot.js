module.exports = function Testbot (opts) {
  const server = require('scuttle-testbot')
    .use(require('ssb-private'))
    .use(require('scuttle-invite-db'))
    .use(require('ssb-query'))
    .use(require('ssb-backlinks'))
    .call(opts)

  return server
}
