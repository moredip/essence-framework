#!/usr/bin/env node
import { boot } from "./server.js"

const args = process.argv.slice(2)
const sourceDir = args.find((arg) => !arg.startsWith("--")) || "./"

// Parse flags
const watchFlag = args.includes("--watch") || args.includes("-w")
const noWatchFlag = args.includes("--no-watch")

// Default to watching in development
const shouldWatch = noWatchFlag
  ? false
  : watchFlag || process.env.NODE_ENV !== "production"

console.log(`🚀 Starting Essence Framework`)
console.log(`📁 Source directory: ${sourceDir}`)
console.log(`👀 File watching: ${shouldWatch ? "enabled" : "disabled"}`)

boot(sourceDir, { watch: shouldWatch }).catch(console.error)
