import * as path from 'path'
import * as walk from 'walkdir'
import logger from './logger'
import { PathActions } from './types'

export async function autoDiscover(apiRootPath: string) {
  logger.info('root for action handlers: ' + apiRootPath)
  const handlerPaths = await walk.async(apiRootPath, { return_object: true })

  for (const [handlerPath, stats] of Object.entries(handlerPaths)) {
    if (!stats.isFile()) {
      continue
    }
    logger.debug('processing: ' + handlerPath)
    const routePath = loppedPath(apiRootPath, handlerPath)
    logger.debug({ routePath })

    const importPath = toImportPath(handlerPath)

    logger.debug(`auto-discovering ${importPath}...`)

    const importedActions = await import(importPath)
    const actions = normalizeActions(importedActions)
    console.log(actions)
  }
}

function normalizeActions(importedActions: any): PathActions {
  const post = importedActions.post || null
  const get = importedActions.get || importedActions.default || null
  return { get, post }
}

function toImportPath(realPath: string) {
  const parsedPath = path.parse(realPath)
  // if (parsedPath.name === 'index') {
  //   return parsedPath.dir
  // } else {
  return parsedPath.dir + path.sep + parsedPath.base
  // }
}

function loppedPath(basePath: string, endPath: string) {
  // TODO: make this robust and good

  const basePathComponents = basePath.split(path.sep)
  const endPathComponents = endPath.split(path.sep)

  const loppedComponents = endPathComponents.slice(
    basePathComponents.length,
    -1
  )
  return path.sep + loppedComponents.join(path.sep)
}
