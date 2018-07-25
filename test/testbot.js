module.exports = function Testbot (opts) {
  const server = require('scuttle-testbot')
    .use(require('ssb-private'))
    .use(require('ssb-query'))
    .call(opts)

  return server
}
