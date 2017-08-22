import Logger from './logger'
import tapOut from 'tap-out'
import through from 'through2'
import duplexer from 'duplexer'

/**
 * Formats TAP output for TeamCity.
 * @module tap-teamcity
 * @return {stream.Duplex} The formatted TAP output.
 */
function tapTeamCity () {
  const output = through()
  const logger = Logger(output)
  const parser = tapOut()
  const stream = duplexer(parser, output)

  // Display previous test (if exists) finished
  // Display current test started
  parser.on('test', test => {
    logger.finishTest()
    logger.startTest(test)
  })

  // Display successful assertions started
  parser.on('pass', assertion => logger.startAssertion(assertion))

  // Display successful assertions finished
  // Display failed assertions started
  parser.on('assert', assertion => {
    if (
      logger.assertion &&
      logger.assertion.test === assertion.test &&
      logger.assertion.number === assertion.number
    ) {
      logger.finishAssertion()
    } else {
      logger.startAssertion(assertion)
    }
  })

  // Display failed assertions failed and finished
  parser.on('fail', assertion => {
    logger.failAssertion()
    logger.finishAssertion()
    stream.failed = true
  })

  // Display everything finished
  parser.on('output', results => {
    logger.finishTest()
    output.push('\n')
    output.push(null)
  })

  return stream
}

export default tapTeamCity
