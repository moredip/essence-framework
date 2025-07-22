#!/usr/bin/env node
import { boot, type ServerOptions } from "./server.js"

const args = process.argv.slice(2)
const sourceDir = args[0] || "./"

const DEV_MODE_OPTIONS: ServerOptions = {
  watch: true,
  console: true,
  openBrowser: true,
}

const PRODUCTION_OPTIONS: ServerOptions = {
  watch: false,
  console: false,
  openBrowser: false,
}

const isProduction = process.env.NODE_ENV === "production"

const options = isProduction ? PRODUCTION_OPTIONS : DEV_MODE_OPTIONS

if (!options.console) {
  console.log(`🚀 Starting Essence Framework`)
  console.log(`📁 Source directory: ${sourceDir}`)
  console.log(`👀 File watching: ${options.watch ? "enabled" : "disabled"}`)
}
boot(sourceDir, options).catch(console.error)
