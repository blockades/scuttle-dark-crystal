const { isRoot, SCHEMA_VERSION } = require('dark-crystal-schemas')

module.exports = function Root (params) {
  var self = Object.assign({}, {
    type: 'dark-crystal/root',
    version: SCHEMA_VERSION
  }, params)

  self.valid = isRoot(params)
  if (params.errors) self.errors = params.errors

  return self
}
