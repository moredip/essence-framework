import { autoDiscover } from 'essence-framework'
import * as path from 'path'
import logger from './logger'

export default function createRunner(targetDir: string) {
  logger.debug(`running essence against ${targetDir}...`)

  async function run() {
    await autoDiscover(path.resolve(targetDir, 'api'))
  }

  return {
    run,
  }
}
