#!/usr/bin/env node
const tapSpec = require('../index.js')()

process.stdin.pipe(tapSpec).pipe(process.stdout)

process.on('exit', status => {
  if (status === 1 || tapSpec.failed) process.exit(1)
})
