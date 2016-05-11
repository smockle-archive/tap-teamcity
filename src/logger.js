/**
 * Calculates the time passed since a specified time.
 * @param {number} time - A specified time, in milliseconds.
 * @return {number} The difference between the specified time and the current time, in milliseconds.
 */
function timeSince (time) {
  return new Date().getTime() - time
}

/**
 * Logs TAP test and assertion data to a writable stream.
 * @module logger
 * @param {stream.Writable} output - A writable stream.
 * @return {Logger}
 */
function Logger (output) {
  const logger = Object.create(Logger.prototype)
  logger.output = output
  return logger
}

/**
 * Logs test started, and remembers test and time
 * @param {object} test - A TAP test result
 */
Logger.prototype.startTest = function (test) {
  this.test = test
  this.testStartTime = new Date().getTime()
  this.output.push(`\n##teamcity[testSuiteStarted name='${this.test.name}']`)
}

/**
 * Logs test finished
 */
Logger.prototype.finishTest = function () {
  if (!this.test) return
  this.output.push(`\n##teamcity[testSuiteFinished name='${this.test.name}' duration='${timeSince(this.testStartTime)}']`)
}

/**
 * Logs assertion started, and remembers assertion and time
 * @param {object} assertion - A TAP assertion result
 */
Logger.prototype.startAssertion = function (assertion) {
  this.assertionStartTime = new Date().getTime()
  this.assertion = assertion
  this.output.push(`\n##teamcity[testStarted name='${this.assertion.name}' captureStandardOutput='true']`)
}

/**
 * Logs assertion failed
 */
Logger.prototype.failAssertion = function () {
  var output = `testFailed name='${this.assertion.name}'`
  if (this.assertion.error && this.assertion.error.expected && this.assertion.error.actual) {
        const expected = this.assertion.error.expected.replace(/'/g, '|\'')
        const actual = this.assertion.error.actual.replace(/'/g, '|\'')
        output = `${output} type='comparisonFailure' expected='${expected}' actual='${actual}'`
  }

  this.output.push(`\n##teamcity[${output}]`)
}

/**
 * Logs assertion finished
 */
Logger.prototype.finishAssertion = function () {
  this.output.push(`\n##teamcity[testFinished name='${this.assertion.name}' duration='${timeSince(this.assertionStartTime)}']`)
}

module.exports = Logger
