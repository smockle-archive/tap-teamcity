const stream = require('stream')
const util = require('util')
const test = require('tape')
const tapTeamCity = require('../src/tap-teamcity')

// Readable stream to load fake TAP output
const TapStream = function (data) {
  stream.Readable.call(this)
  this.data = data
  this.index = 0
}
util.inherits(TapStream, stream.Readable)
TapStream.prototype._read = function () {
  if (this.index === this.data.length) {
    return this.push(null)
  }
  var data = this.data[this.index++]
  this.push(data)
}

// Writable stream to run assertions on formatted output
const AssertStream = function (callbacks) {
  stream.Writable.call(this)
  this.callbacks = callbacks
  this.index = 0
}
util.inherits(AssertStream, stream.Writable)
AssertStream.prototype._write = function (chunk, enc, next) {
  if (this.callbacks && this.callbacks.length > this.index) {
    this.callbacks[this.index++](chunk.toString())
  }
  next()
}

test('tapTeamCity, test', t => {
  t.plan(3)

  const input = ['# first test']
  const tapStream = new TapStream(input)

  const checkStart = data =>
    t.equal(
      data,
      "\n##teamcity[testSuiteStarted name='first test']",
      'streams test started message'
    )
  const checkFinish = data =>
    t.ok(
      /^\n##teamcity\[testSuiteFinished name='first test'/.test(data),
      'streams test finished message'
    )
  const assertStream = new AssertStream([checkStart, checkFinish])
  assertStream.on('finish', () => t.ok(true, 'ends'))

  tapStream.pipe(tapTeamCity()).pipe(assertStream)
})

test('tapTeamCity, ok assertion', t => {
  t.plan(4)

  const input = ['ok 1 first assert']
  const tapStream = new TapStream(input)

  const checkStart = data =>
    t.equal(
      data,
      "\n##teamcity[testStarted name='first assert' captureStandardOutput='true']",
      'streams assertion started message'
    )
  const checkFinish = data =>
    t.ok(
      /^\n##teamcity\[testFinished name='first assert'/.test(data),
      'streams assertion finished message'
    )
  const checkEnd = data => t.equal(data, '\n', 'streams an empty string')
  const assertStream = new AssertStream([checkStart, checkFinish, checkEnd])
  assertStream.on('finish', () => t.ok(true, 'ends'))

  tapStream.pipe(tapTeamCity()).pipe(assertStream)
})

test('tapTeamCity, not ok assertion', t => {
  t.plan(4)

  const input = [
    'not ok 2 second assert\n  ---\n    operator: equal\n    expected: false\n    actual:   true\n   at: Test.<anonymous> (./tap-teamcity.js:15:5)\n  ...'
  ]
  const tapStream = new TapStream(input)

  const checkStart = data =>
    t.equal(
      data,
      "\n##teamcity[testStarted name='second assert' captureStandardOutput='true']",
      'streams assertion started message'
    )
  const checkFailed = data =>
    t.equal(
      data,
      "\n##teamcity[testFailed name='second assert' type='comparisonFailure' expected='false' actual='true']",
      'streams assertion failed message'
    )
  const checkFinish = data =>
    t.ok(
      /^\n##teamcity\[testFinished name='second assert'/.test(data),
      'streams assertion finished message'
    )
  const assertStream = new AssertStream([checkStart, checkFailed, checkFinish])
  assertStream.on('finish', () => t.ok(true, 'ends'))

  tapStream.pipe(tapTeamCity()).pipe(assertStream)
})
