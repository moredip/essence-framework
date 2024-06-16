#!/usr/bin/env node
import path from "path"
import { spawn, execSync } from "node:child_process"

const forwardedArgs = process.argv.slice(2)

// We expect that this file will be running as an installed binary in the node_modules/.bin directory.
// We also expect ts-node to be installed in node_modules/snz/node_modules/.bin/ts-node
// const tsNodeBinaryPath = path.resolve(__dirname, "..", "snz", "node_modules", ".bin", "ts-node")
const tsNodeBinaryPath = path.resolve(
  execSync("pwd").toString().trim(),
  "node_modules",
  "snz",
  "node_modules",
  ".bin",
  "ts-node",
)

const child = spawn(tsNodeBinaryPath, [
  "-T",
  "node_modules/snz/dist/cli/essence-watch.js",
  ...forwardedArgs,
])

// Stream the stdout to the parent process stdout
child.stdout.pipe(process.stdout)

// Stream the stderr to the parent process stderr
child.stderr.pipe(process.stderr)
