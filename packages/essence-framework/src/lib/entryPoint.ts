import path = require('path')
import { autoDiscover } from './autoDiscovery'
import logger from './logger'
import { createServer } from './server'

export default async function essence(targetPath: string) {
  logger.debug(`booting server for ${targetPath}...`)

  const essenceServer = await createServer()

  await autoDiscover(
    path.resolve(targetPath, 'api'),
    essenceServer.registerPathActions
  )

  return essenceServer
}
