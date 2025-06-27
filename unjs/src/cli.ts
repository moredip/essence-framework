#!/usr/bin/env node
import { boot } from "./server"

const sourceDir = process.argv[2] || "./"

boot(sourceDir).catch(console.error)
