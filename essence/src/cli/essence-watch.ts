#!/usr/bin/env node

import nodemon from "nodemon"
import path from "path"

const targetDir = process.argv[2] || "."

nodemon({
  script: path.join(__dirname, "essence.js"),
  args: [targetDir],
  watch: [targetDir],
  verbose: true,
  ext: "*",
})
