#!/usr/bin/env node
const tapSpec = require('../lib/tap-teamcity.js')()

process.stdin.pipe(tapSpec).pipe(process.stdout)

process.on('exit', status => {
  if (status === 1 || tapSpec.failed) process.exit(1)
})
