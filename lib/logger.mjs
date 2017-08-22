/**
 * Calculates the time passed since a specified time.
 * @param {number} time - A specified time, in milliseconds.
 * @return {number} The difference between the specified time and the current time, in milliseconds.
 */
function timeSince (time) {
  return new Date().getTime() - time
}

function assertionHasDetails (assertion) {
  return assertion.error && assertion.error.expected && assertion.error.actual
}

function escape (message) {
  if (!message) {
    return ''
  }

  return message
    .toString()
    .replace(/\|/g, '||')
    .replace(/\n/g, '|n')
    .replace(/\r/g, '|r')
    .replace(/\[/g, '|[')
    .replace(/\]/g, '|]')
    .replace(/\u0085/g, '|x') // next line
    .replace(/\u2028/g, '|l') // line separator
    .replace(/\u2029/g, '|p') // paragraph separator
    .replace(/'/g, "|'")
}

function formatMessage (name, attributes) {
  const attributesString = Object.entries(attributes)
    .map(([k, v]) => `${k}='${escape(v)}'`)
    .join(' ')

  return `\n##teamcity[${name} ${attributesString}]`
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
  this.output.push(formatMessage('testSuiteStarted', { name: this.test.name }))
}

/**
 * Logs test finished
 */
Logger.prototype.finishTest = function () {
  if (!this.test) return
  this.output.push(
    formatMessage('testSuiteFinished', {
      name: this.test.name,
      duration: timeSince(this.testStartTime)
    })
  )
}

/**
 * Logs assertion started, and remembers assertion and time
 * @param {object} assertion - A TAP assertion result
 */
Logger.prototype.startAssertion = function (assertion) {
  this.assertionStartTime = new Date().getTime()
  this.assertion = assertion
  this.output.push(
    formatMessage('testStarted', {
      name: this.assertion.name,
      captureStandardOutput: true
    })
  )
}

/**
 * Logs assertion failed
 */
Logger.prototype.failAssertion = function () {
  const properties = { name: this.assertion.name }
  const assertion = this.assertion

  if (assertionHasDetails(assertion)) {
    const expected = assertion.error.expected
    const actual = assertion.error.actual
    Object.assign(properties, {
      type: 'comparisonFailure',
      expected,
      actual
    })
  }

  this.output.push(formatMessage('testFailed', properties))
}

/**
 * Logs assertion finished
 */
Logger.prototype.finishAssertion = function () {
  this.output.push(
    formatMessage('testFinished', {
      name: this.assertion.name,
      duration: timeSince(this.assertionStartTime)
    })
  )
}

export default Logger
