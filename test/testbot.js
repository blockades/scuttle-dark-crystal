module.exports = function Testbot (opts) {
  const server = require('scuttle-testbot')
    .use(require('ssb-private'))
    .use(require('ssb-query'))
    .use(require('ssb-backlinks'))
    .use(require('ssb-ephemeral-keys'))
    .call(opts)

  return server
}
