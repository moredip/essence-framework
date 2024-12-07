#!/usr/bin/env node

import nodemon from "nodemon"
import path from "path"

const targetDir = process.argv[2] || "."

// This is a hacky way to detect whether this is the first time the server is started.
// Each time the server boots, it looks for this env var and checks whether it is within
// the last few seconds.
// If it is, then we can assume we have just launched the watch process.
// If it's not, then we assumed we're restarting because of a file change.
process.env["NODEMON_ESSENCE_TIMESTAMP"] = new Date().getTime().toString()

nodemon({
  script: path.join(__dirname, "snz.js"),
  // @ts-ignore: TS2353 - args is a working parameter accepted by `nodemon()`, but not documented in the type definition
  args: [targetDir],
  watch: [targetDir],
  verbose: true,
  ext: "*",
})
