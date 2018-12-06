const isString = require('./isString')

module.exports = function secretObject (secret) {
  let secretObj
  try {
    secretObj = JSON.parse(secret)
    assert(Object.keys(secretObj).length === 2)
    assert(isString(secretObj.secret))
    assert(isString(secretObj.nickname))
  } catch (err) {
    secretObj = { secret }
  }
  return secretObj
}

function assert (test) {
  if (!test) throw new Error('AssertionError')
}
