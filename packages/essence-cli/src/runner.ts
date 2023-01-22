import essence, { autoDiscover, createServer } from 'essence-framework'
import * as path from 'path'
import logger from './logger'

export default function createRunner(targetDir: string) {
  async function run() {
    const essenceServer = await essence(targetDir)
    await essenceServer.startServer()
  }

  return {
    run,
  }
}
