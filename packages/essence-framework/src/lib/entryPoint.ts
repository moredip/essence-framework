import { autoDiscover } from './autoDiscovery'
import logger from './logger'

export default async function essence(apiPath: string) {
  logger.debug(`booting server for ${apiPath}...`)

  autoDiscover(apiPath)
}
