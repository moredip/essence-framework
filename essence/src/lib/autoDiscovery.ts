import * as path from "path"
import * as walk from "walkdir"
import logger from "./logger"
import { RegisterPathActionsFn } from "./router"
import { normalizeImportedAction } from "./actionAdapter"
import { PathActions, BLANK_PATH_ACTIONS } from "./types"

export async function autoDiscover(
  apiRootPath: string,
  registerPathActions: RegisterPathActionsFn,
) {
  logger.info("root for action handlers: " + apiRootPath)
  const routePath = routePathWithBase(apiRootPath)
  const handlerPaths = await walk.async(apiRootPath, { return_object: true })

  for (const [handlerPath, stats] of Object.entries(handlerPaths)) {
    if (!stats.isFile()) {
      continue
    }
    logger.debug("handlerPath: " + handlerPath)
    const route = routePath(handlerPath)
    logger.debug("route: " + route)

    const importedActions = await import(handlerPath)
    const actions = normalizeActions(importedActions)

    registerPathActions(actions, route)
  }
}

function normalizeActions(importedActions: any): PathActions {
  if (typeof importedActions === "function") {
    return { ...BLANK_PATH_ACTIONS, get: importedActions }
  }

  const get = normalizeImportedAction(importedActions.get || importedActions.default || null)
  const post = normalizeImportedAction(importedActions.post || null)
  const put = normalizeImportedAction(importedActions.put || null)
  const patch = normalizeImportedAction(importedActions.patch || null)
  // TODO: also support `delete` being exported
  const delete_ = normalizeImportedAction(importedActions.delete_ || null)
  const options = normalizeImportedAction(importedActions.options || null)
  return { get, post, put, patch, delete: delete_, options }
}

export function routePathWithBase(basePath: string) {
  return function routePath(actionHandlerPath: string) {
    const relative = path.relative(basePath, actionHandlerPath)

    // courtesy https://stackoverflow.com/questions/37521893/determine-if-a-path-is-subdirectory-of-another-in-node-js
    if (!(relative && !relative.startsWith("..") && !path.isAbsolute(relative))) {
      throw new Error(`${actionHandlerPath} is not a subdirectory of ${basePath}`)
    }

    const parsed = path.parse(relative)

    if (parsed.name === "index") {
      return "/" + parsed.dir
    }

    const prefix = parsed.dir === "" ? "" : "/"

    return prefix + parsed.dir + "/" + parsed.name
  }
}
