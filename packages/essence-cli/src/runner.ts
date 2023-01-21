import { autoDiscover } from 'essence-framework'
import * as path from 'path'
import logger from './logger'

export default function createRunner(targetDir: string) {
  logger.debug(`running essence against ${targetDir}...`)

  async function run() {
    function r(path: string) {
      console.log('being asked to IMPORT:', path)
      debugger
      return require(path)
    }
    await autoDiscover(path.resolve(targetDir, 'api'), r)
  }

  return {
    run,
  }
}
