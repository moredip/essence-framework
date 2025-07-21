#!/usr/bin/env node
import { boot } from "./server.js"

const args = process.argv.slice(2)
const sourceDir = args[0] || "./"

const isProduction = process.env.NODE_ENV === "production"

// In development: use TUI console and file watching
// In production: use regular console output and no file watching
const shouldWatch = !isProduction
const shouldShowConsole = !isProduction

if (!shouldShowConsole) {
  console.log(`🚀 Starting Essence Framework`)
  console.log(`📁 Source directory: ${sourceDir}`)
  console.log(`👀 File watching: ${shouldWatch ? "enabled" : "disabled"}`)
}

boot(sourceDir, { watch: shouldWatch, console: shouldShowConsole }).catch(console.error)
