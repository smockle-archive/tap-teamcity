#!/usr/bin/env node
import tapTeamCity from '../lib/tap-teamcity.mjs'
const tapSpec = tapTeamCity()

process.stdin.pipe(tapSpec).pipe(process.stdout)

process.on('exit', status => {
  if (status === 1 || tapSpec.failed) process.exit(1)
})
