const curry       = require('../funcs/curry')
const isFunction  = require('../internal/isFunction')

function either(lf, rf, m) {
  if(!isFunction(lf) || !isFunction(rf)) {
    throw new TypeError('either: first two args must be functions')
  }
  else if(!(m && isFunction(m.either))) {
    throw new TypeError('either: Last arg must be an Either')
  }

  return m.either(lf, rf)
}

module.exports = curry(either)