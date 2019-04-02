const assert = require('./assert')
const { isBlobId } = require('ssb-ref')

module.exports = function unpackLink (link) {
  const index = link.indexOf('?')
  const blobId = link.substring(0, index)
  const blobKey = link.substring(index + 1)
  assert((blobKey.length), 'Blob not encrypted')
  // TODO: test for well formed blob key
  assert((isBlobId(blobId)), 'attachment contains invalid blob reference')
  return { blobId, blobKey }
}
