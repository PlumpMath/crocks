const test = require('tape')
const helpers = require('../test/helpers')
const sinon = require('sinon')

const bindFunc = helpers.bindFunc
const isFunction = require('../predicates/isFunction')
const isObject = require('../predicates/isObject')
const unit = require('../helpers/unit')

const identity = require('../combinators/identity')
const composeB = require('../combinators/composeB')
const constant = require('../combinators/constant')

const Pair = require('./Pair')

const Arrow = require('./Arrow')

test('Arrow', t => {
  const a = bindFunc(Arrow)

  t.ok(isFunction(Arrow), 'is a function')

  t.ok(isFunction(Arrow.type), 'provides a type function')
  t.ok(isFunction(Arrow.id), 'provides an id function')

  t.ok(isObject(Arrow(unit)), 'returns an object')

  t.throws(Arrow, TypeError, 'throws with nothing')
  t.throws(a(undefined), TypeError, 'throws with undefined')
  t.throws(a(null), TypeError, 'throws with undefined')
  t.throws(a(0), TypeError, 'throws with falsey number')
  t.throws(a(1), TypeError, 'throws with truthy number')
  t.throws(a(''), TypeError, 'throws with falsey string')
  t.throws(a('string'), TypeError, 'throws with truthy string')
  t.throws(a(false), TypeError, 'throws with false')
  t.throws(a(true), TypeError, 'throws with true')
  t.throws(a({}), TypeError, 'throws with an object')
  t.throws(a([]), TypeError, 'throws with an array')

  t.doesNotThrow(a(unit), 'allows a function')

  t.end()
})

test('Arrow inspect', t => {
  const a = Arrow(unit)

  t.ok(isFunction(a.inspect), 'provides an inspect function')
  t.equal(a.inspect(), 'Arrow Function', 'returns inspect string')

  t.end()
})

test('Arrow type', t => {
  const a = Arrow(unit)
  t.ok(isFunction(a.type), 'is a function')

  t.equal(a.type, Arrow.type, 'static and instance versions are the same')
  t.equal(a.type(), 'Arrow', 'reports Arrow')

  t.end()
})

test('Arrow value', t => {
  const f = constant('dat function')
  const a = Arrow(f)

  t.ok(isFunction(a.value), 'is a function')
  t.equal(a.value()(), f(), 'provides the wrapped function')

  t.end()
})

test('Arrow runWith', t => {
  const f = sinon.spy(identity)
  const a = Arrow(f)

  t.ok(isFunction(a.runWith), 'is a function')

  const result = a.runWith('apple')

  t.ok(f.calledWith('apple'), 'calls the wrapped function passing provided argument')
  t.ok(f.returned(result), 'returns the result of the wrapped function')

  t.end()
})

test('Arrow compose functionality', t => {
  const f = x => x + 1
  const g = x => x * 0

  const x = 13
  const result = composeB(g, f)(x)

  const a = Arrow(f)
  const b = Arrow(g)

  const notArrow = { type: constant('Arrow...Not') }

  const cat = bindFunc(a.compose)

  t.throws(cat(undefined), TypeError, 'throws with undefined')
  t.throws(cat(null), TypeError, 'throws with null')
  t.throws(cat(0), TypeError, 'throws with falsey number')
  t.throws(cat(1), TypeError, 'throws with truthy number')
  t.throws(cat(''), TypeError, 'throws with falsey string')
  t.throws(cat('string'), TypeError, 'throws with truthy string')
  t.throws(cat(false), TypeError, 'throws with false')
  t.throws(cat(true), TypeError, 'throws with true')
  t.throws(cat([]), TypeError, 'throws with an array')
  t.throws(cat({}), TypeError, 'throws with an object')
  t.throws(cat(notArrow), TypeError, 'throws with non-Arrow')

  t.same(a.compose(b).runWith(x), result, 'builds composition as expected')

  t.end()
})

test('Arrow compose properties (Semigroupoid)', t => {
  const a = Arrow(x => x + 1)
  const b = Arrow(x => x * 10)
  const c = Arrow(x => x - 5)

  t.ok(isFunction(Arrow(identity).compose), 'is a function')

  const left = a.compose(b).compose(c).runWith
  const right = a.compose(b.compose(c)).runWith
  const x = 20

  t.same(left(x), right(x), 'associativity')
  t.same(a.compose(b).type(), a.type(), 'returns Semigroupoid of same type')

  t.end()
})

test('Arrow id functionality', t => {
  const m = Arrow(unit).id()

  t.equal(m.id, Arrow.id, 'static and instance versions are the same')

  t.equal(m.type(), Arrow.type(), 'provides an Arrow')
  t.same(m.runWith(13), 13, 'wraps an identity function')

  t.end()
})

test('Arrow id properties (Category)', t => {
  const m = Arrow(x => x + 45)
  const x = 32

  t.ok(isFunction(m.compose), 'provides a compose function')
  t.ok(isFunction(m.id), 'provides an id function')

  const right = m.compose(m.id()).runWith
  const left = m.id().compose(m).runWith

  t.same(right(x), m.runWith(x), 'right identity')
  t.same(left(x), m.runWith(x), 'left identity')

  t.end()
})

test('Arrow map errors', t => {
  const map = bindFunc(Arrow(unit).map)

  t.throws(map(undefined), TypeError, 'throws with undefined')
  t.throws(map(null), TypeError, 'throws with null')
  t.throws(map(0), TypeError, 'throws with falsey number')
  t.throws(map(1), TypeError, 'throws with truthy number')
  t.throws(map(''), TypeError, 'throws with falsey string')
  t.throws(map('string'), TypeError, 'throws with truthy string')
  t.throws(map(false), TypeError, 'throws with false')
  t.throws(map(true), TypeError, 'throws with true')
  t.throws(map([]), TypeError, 'throws with an array')
  t.throws(map({}), TypeError, 'throws with an object')

  t.doesNotThrow(map(unit), 'allows functions')

  t.end()
})

test('Arrow map functionality', t => {
  const x = 42
  const spy = sinon.spy(identity)

  const m = Arrow(identity).map(spy)

  t.equal(m.type(), 'Arrow', 'returns an Arrow')
  t.notOk(spy.called, 'does not call mapping function initially')

  m.runWith(x)

  t.ok(spy.called, 'calls mapping function when ran')
  t.equal(m.runWith(x), x, 'returns the result of the resulting composition')

  t.end()
})

test('Arrow map properties (Functor)', t => {
  const m = Arrow(identity)

  const f = x => x + 12
  const g = x => x * 10

  const x = 76

  t.ok(isFunction(m.map), 'provides a map function')

  t.equal(m.map(identity).runWith(x), m.runWith(x), 'identity')
  t.equal(m.map(composeB(f, g)).runWith(x), m.map(g).map(f).runWith(x), 'composition')

  t.end()
})

test('Arrow contramap errors', t => {
  const cmap = bindFunc(Arrow(unit).contramap)

  t.throws(cmap(undefined), TypeError, 'throws with undefined')
  t.throws(cmap(null), TypeError, 'throws with null')
  t.throws(cmap(0), TypeError, 'throws with falsey number')
  t.throws(cmap(1), TypeError, 'throws with truthy number')
  t.throws(cmap(''), TypeError, 'throws with falsey string')
  t.throws(cmap('string'), TypeError, 'throws with truthy string')
  t.throws(cmap(false), TypeError, 'throws with false')
  t.throws(cmap(true), TypeError, 'throws with true')
  t.throws(cmap([]), TypeError, 'throws with an array')
  t.throws(cmap({}), TypeError, 'throws with an object')

  t.doesNotThrow(cmap(unit), 'allows functions')

  t.end()
})

test('Arrow contramap functionality', t => {
  const spy = sinon.spy(identity)
  const x = 7

  const m = Arrow(identity).contramap(spy)

  t.equal(m.type(), 'Arrow', 'returns an Arrow')
  t.notOk(spy.called, 'does not call mapping function initially')

  m.runWith(x)

  t.ok(spy.called, 'calls mapping function when ran')
  t.equal(m.runWith(x), x, 'returns the result of the resulting composition')

  t.end()
})

test('Arrow contramap properties (Contra Functor)', t => {
  const m = Arrow(identity)

  const f = x => x + 12
  const g = x => x * 10

  const x = 76

  t.ok(isFunction(m.contramap), 'provides a contramap function')

  t.equal(m.contramap(identity).runWith(x), m.runWith(x), 'identity')
  t.equal(m.contramap(composeB(f, g)).runWith(x), m.contramap(f).contramap(g).runWith(x), 'composition')

  t.end()
})

test('Arrow promap errors', t => {
  const promap = bindFunc(Arrow(unit).promap)

  t.throws(promap(undefined, unit), TypeError, 'throws with undefined as first argument')
  t.throws(promap(null, unit), TypeError, 'throws with null as first argument')
  t.throws(promap(0, unit), TypeError, 'throws with falsey number as first argument')
  t.throws(promap(1, unit), TypeError, 'throws with truthy number as first argument')
  t.throws(promap('', unit), TypeError, 'throws with falsey string as first argument')
  t.throws(promap('string', unit), TypeError, 'throws with truthy string as first argument')
  t.throws(promap(false, unit), TypeError, 'throws with false as first argument')
  t.throws(promap(true, unit), TypeError, 'throws with true as first argument')
  t.throws(promap([], unit), TypeError, 'throws with an array as first argument')
  t.throws(promap({}, unit), TypeError, 'throws with an object as first argument')

  t.throws(promap(unit, undefined), TypeError, 'throws with undefined as second argument')
  t.throws(promap(unit, null), TypeError, 'throws with null as second argument')
  t.throws(promap(unit, 0), TypeError, 'throws with falsey number as second argument')
  t.throws(promap(unit, 1), TypeError, 'throws with truthy number as second argument')
  t.throws(promap(unit, ''), TypeError, 'throws with falsey string as second argument')
  t.throws(promap(unit, 'string'), TypeError, 'throws with truthy string as second argument')
  t.throws(promap(unit, false), TypeError, 'throws with false as second argument')
  t.throws(promap(unit, true), TypeError, 'throws with true as second argument')
  t.throws(promap(unit, []), TypeError, 'throws with an array as second argument')
  t.throws(promap(unit, {}), TypeError, 'throws with an object as second argument')

  t.doesNotThrow(promap(unit, unit), 'allows functions')

  t.end()
})

test('Arrow promap functionality', t => {
  const x = 42
  const f = x => x * 20
  const g = x => x + 10

  const spyLeft = sinon.spy(f)
  const spyRight = sinon.spy(g)

  const comp = composeB(g, f)

  const m = Arrow(identity).promap(spyLeft, spyRight)

  t.equal(m.type(), 'Arrow', 'returns an Arrow')
  t.notOk(spyLeft.called, 'does not call left mapping function initially')
  t.notOk(spyRight.called, 'does not call right mapping function initially')

  m.runWith(x)

  t.ok(spyLeft.called, 'calls left mapping function when ran')
  t.ok(spyRight.called, 'calls right mapping function when ran')
  t.equal(m.runWith(x), comp(x), 'returns the result of the resulting composition')

  t.end()
})

test('Arrow promap properties (Profunctor)', t => {
  const m = Arrow(identity)

  const f = x => x + 12
  const g = x => x * 10

  const h = x => x + 2
  const k = x => x * 2

  const x = 76

  t.ok(isFunction(m.map), 'provides a map function')
  t.ok(isFunction(m.promap), 'provides a promap function')

  t.equal(m.promap(identity, identity).runWith(x), m.runWith(x), 'identity')

  t.equal(
    m.promap(composeB(f, g), composeB(h, k)).runWith(x),
    m.promap(f, k).promap(g, h).runWith(x),
    'composition'
  )

  t.end()
})

test('Arrow first', t => {
  t.ok(isFunction(Arrow(unit).first), 'provides a first function')

  const m = Arrow(x => x + 1)

  const runWith = bindFunc(m.first().runWith)

  t.throws(runWith(undefined), TypeError, 'throws with undefined as inner argument')
  t.throws(runWith(null), TypeError, 'throws with null as inner argument')
  t.throws(runWith(0), TypeError, 'throws with falsey number as inner argument')
  t.throws(runWith(1), TypeError, 'throws with truthy number as inner argument')
  t.throws(runWith(''), TypeError, 'throws with falsey string as inner argument')
  t.throws(runWith('string'), TypeError, 'throws with truthy string as inner argument')
  t.throws(runWith(false), TypeError, 'throws with false as inner argument')
  t.throws(runWith(true), TypeError, 'throws with true as inner argument')
  t.throws(runWith([]), TypeError, 'throws with an array as inner argument')
  t.throws(runWith({}), TypeError, 'throws with an object as inner argument')

  t.doesNotThrow(runWith(Pair(1, 2)), 'does not throw when inner value is a Pair')

  const result = m.first().runWith(Pair(10, 10))

  t.equal(result.type(), 'Pair', 'returns a Pair')
  t.equal(result.fst(), 11, 'applies the function to the fst element of a pair')
  t.equal(result.snd(), 10, 'does not apply the function to the second element of a pair')

  t.end()
})

test('Arrow second', t => {
  t.ok(isFunction(Arrow(unit).second), 'provides a second function')

  const m = Arrow(x => x + 1)

  const runWith = bindFunc(m.second().runWith)

  t.throws(runWith(undefined), TypeError, 'throws with undefined as inner argument')
  t.throws(runWith(null), TypeError, 'throws with null as inner argument')
  t.throws(runWith(0), TypeError, 'throws with falsey number as inner argument')
  t.throws(runWith(1), TypeError, 'throws with truthy number as inner argument')
  t.throws(runWith(''), TypeError, 'throws with falsey string as inner argument')
  t.throws(runWith('string'), TypeError, 'throws with truthy string as inner argument')
  t.throws(runWith(false), TypeError, 'throws with false as inner argument')
  t.throws(runWith(true), TypeError, 'throws with true as inner argument')
  t.throws(runWith([]), TypeError, 'throws with an array as inner argument')
  t.throws(runWith({}), TypeError, 'throws with an object as inner argument')

  t.doesNotThrow(runWith(Pair(1, 2)), 'does not throw when inner value is a Pair')

  const result = m.second().runWith(Pair(10, 10))

  t.equal(result.type(), 'Pair', 'returns a Pair')
  t.equal(result.snd(), 11, 'applies the function to the snd element of a pair')
  t.equal(result.fst(), 10, 'does not apply the function to the first element of a pair')

  t.end()
})

test('Arrow both', t => {
  t.ok(isFunction(Arrow(unit).both), 'provides a both function')

  const m = Arrow(x => x + 1)

  const runWith = bindFunc(m.both().runWith)

  t.throws(runWith(undefined), TypeError, 'throws with undefined as inner argument')
  t.throws(runWith(null), TypeError, 'throws with null as inner argument')
  t.throws(runWith(0), TypeError, 'throws with falsey number as inner argument')
  t.throws(runWith(1), TypeError, 'throws with truthy number as inner argument')
  t.throws(runWith(''), TypeError, 'throws with falsey string as inner argument')
  t.throws(runWith('string'), TypeError, 'throws with truthy string as inner argument')
  t.throws(runWith(false), TypeError, 'throws with false as inner argument')
  t.throws(runWith(true), TypeError, 'throws with true as inner argument')
  t.throws(runWith([]), TypeError, 'throws with an array as inner argument')
  t.throws(runWith({}), TypeError, 'throws with an object as inner argument')

  t.doesNotThrow(runWith(Pair(1, 2)), 'does not throw when inner value is a Pair')

  const result = m.both().runWith(Pair(10, 10))

  t.equal(result.type(), 'Pair', 'returns a Pair')
  t.equal(result.fst(), 11, 'applies the function to the first element of a pair')
  t.equal(result.snd(), 11, 'applies the function to the snd element of a pair')

  t.end()
})
