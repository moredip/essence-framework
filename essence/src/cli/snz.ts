#!/usr/bin/env node

import main from "./main"

main(process.argv, detectRestart())

function detectRestart() {
  const timestamp = process.env["NODEMON_ESSENCE_TIMESTAMP"]
  if (!timestamp) {
    return false
  }
  const now = new Date().getTime()
  const then = parseInt(timestamp)
  return now - then > 3_000 // 3 seconds
}
