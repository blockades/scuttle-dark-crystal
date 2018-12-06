module.exports = function secretObject (secret) {
  let secretObj
  try {
    secretObj = JSON.parse(secret)
    // TODO should we use is-my-json-valid to be a bit stricter here?
    if (Object.keys(secretObj).indexOf('secret') < 0) throw new Error('missing secret')
    if (Object.keys(secretObj).indexOf('nickname') < 0) throw new Error('missing nickname')
    if (Object.keys(secretObj).length > 2) throw new Error('too many properties')
  } catch (err) {
    secretObj = { secret }
  }
  return secretObj
}
