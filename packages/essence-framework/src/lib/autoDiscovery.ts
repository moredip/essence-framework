import * as path from 'path'
import * as walk from 'walkdir'
import logger from './logger'

export async function autoDiscover(
  apiRootPath: string,
  importer: any = () => {}
) {
  logger.info('root for action handlers: ' + apiRootPath)
  const handlerPaths = await walk.async(apiRootPath, { return_object: true })

  for (const [handlerPath, stats] of Object.entries(handlerPaths)) {
    if (!stats.isFile()) {
      continue
    }
    logger.debug('processing: ' + handlerPath)

    const importPath = toImportPath(handlerPath)

    logger.debug(`auto-discovering ${importPath}...`)

    console.log('importing...')
    const actionHandler = await importer(/* webpackIgnore: true */ importPath)

    // TODO: figure out what this is supposed to be returning
    console.log('imported: ', JSON.stringify(actionHandler))
  }
}

function toImportPath(realPath: string) {
  const parsedPath = path.parse(realPath)
  // if (parsedPath.name === 'index') {
  //   return parsedPath.dir
  // } else {
  return parsedPath.dir + path.sep + parsedPath.base
  // }
}
