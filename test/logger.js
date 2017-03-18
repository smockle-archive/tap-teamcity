const test = require('tape')
const through = require('through2')
const Logger = require('../src/logger')

test('Logger.constructor', t => {
  t.plan(2)
  const output = through()

  // 1
  t.ok(Logger(through()) instanceof Logger, 'returns an instance of Logger')
  // 2
  t.equal(Logger(output).output, output, 'stores output stream')
})

test('Logger.prototype.startTest', t => {
  t.plan(4)
  const pastTime = new Date().getTime()
  var result = ''
  const output = through()
  output.on('data', d => {
    result += d
  })
  const logger = Logger(output)
  const test = {name: 'TestName'}
  logger.startTest(test)

  // 3
  t.deepEqual(logger.test, test, 'stores test')
  // 4
  t.equal(typeof logger.testStartTime, 'number', 'stores time')
  // 5
  t.ok(
    pastTime <= logger.testStartTime &&
      logger.testStartTime <= new Date().getTime(),
    'stores valid time'
  )
  // 6
  t.equal(
    result,
    `\n##teamcity[testSuiteStarted name='${test.name}']`,
    'pushes test start string to output stream'
  )
})

test('Logger.prototype.finishTest', t => {
  t.plan(2)
  var result = ''
  const output = through()
  output.on('data', d => {
    result += d
  })
  const logger = Logger(output)

  // 7
  logger.finishTest()
  t.equal(result, '', 'terminates early when this.test is unset')
  // 8
  const test = {name: 'TestName'}
  logger.startTest(test)
  result = ''
  logger.finishTest()
  const regexpFront = new RegExp(
    `^\\n##teamcity\\[testSuiteFinished name='${test.name}'`
  )
  const regexpBack = / duration='[0-9]*']$/
  t.ok(
    regexpFront.test(result) && regexpBack.test(result),
    'pushes test end string to output stream'
  )
})

test('Logger.prototype.startAssertion', t => {
  t.plan(4)
  const pastTime = new Date().getTime()
  var result = ''
  const output = through()
  output.on('data', d => {
    result += d
  })
  const logger = Logger(output)
  const assertion = {name: 'AssertionName'}
  logger.startAssertion(assertion)

  // 9
  t.deepEqual(logger.assertion, assertion, 'stores assertion')
  // 10
  t.equal(typeof logger.assertionStartTime, 'number', 'stores time')
  // 11
  t.ok(
    pastTime <= logger.assertionStartTime &&
      logger.assertionStartTime <= new Date().getTime(),
    'stores valid time'
  )
  // 12
  t.equal(
    result,
    `\n##teamcity[testStarted name='${assertion.name}' captureStandardOutput='true']`,
    'pushes assertion start string to output stream'
  )
})

test('Logger.prototype.failAssertion', t => {
  t.plan(1)
  var result = ''
  const output = through()
  output.on('data', d => {
    result += d
  })
  const logger = Logger(output)
  const assertion = {
    name: 'AssertionName',
    error: {expected: 'expected', actual: 'actual'}
  }
  logger.startAssertion(assertion)
  result = ''
  logger.failAssertion()

  // 13
  t.equal(
    result,
    `\n##teamcity[testFailed name='${assertion.name}' type='comparisonFailure' expected='${assertion.error.expected}' actual='${assertion.error.actual}']`,
    'pushes assertion fail string to output stream'
  )
})

test('Logger.prototype.failAssertion with quotes', t => {
  t.plan(1)
  var result = ''
  const output = through()
  output.on('data', d => {
    result += d
  })
  const logger = Logger(output)
  const assertion = {
    name: 'AssertionName',
    error: {expected: "expected' quotes'", actual: "actual ' with ' quotes"}
  }
  logger.startAssertion(assertion)
  result = ''
  logger.failAssertion()

  // 13
  t.equal(
    result,
    `\n##teamcity[testFailed name='${assertion.name}' type='comparisonFailure' expected='expected|' quotes|'' actual='actual |' with |' quotes']`,
    'escapes quotes'
  )
})

test('Logger.prototype.failAssertion without error', t => {
  t.plan(1)
  var result = ''
  const output = through()
  output.on('data', d => {
    result += d
  })
  const logger = Logger(output)
  const assertion = {name: 'AssertionName'}
  logger.startAssertion(assertion)
  result = ''
  logger.failAssertion()

  // 13
  t.equal(
    result,
    `\n##teamcity[testFailed name='${assertion.name}']`,
    'pushes assertion fail string to output stream'
  )
})

test('Logger.prototype.finishAssertion', t => {
  t.plan(1)
  var result = ''
  const output = through()
  output.on('data', d => {
    result += d
  })
  const logger = Logger(output)
  const assertion = {name: 'AssertionName'}
  logger.startAssertion(assertion)
  result = ''
  logger.finishAssertion()

  // 14
  const regexpFront = new RegExp(
    `^\\n##teamcity\\[testFinished name='${assertion.name}'`
  )
  const regexpBack = / duration='[0-9]*']$/
  t.ok(
    regexpFront.test(result) && regexpBack.test(result),
    'pushes assertion end string to output stream'
  )
})
