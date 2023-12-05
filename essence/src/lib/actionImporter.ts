import path from "path"
import {
  makeStaticFileAction,
  normalizeImportedAction,
  routeAssemblerForPathActions,
} from "./actionAdapter"
import { ExpressRouteReceiver, PathActions, buildPathActions } from "./types"

export async function loadActionsFromFile(handlerPath: string): Promise<ExpressRouteReceiver> {
  switch (path.extname(handlerPath)) {
    case ".js":
    case ".ts":
      return await loadActionsFromCodeFile(handlerPath)
    case ".txt":
      return await loadActionsFromTextFile(handlerPath)
    default:
      throw `unrecognized extension for server file ${handlerPath}`
  }
}

async function loadActionsFromCodeFile(handlerPath: string): Promise<ExpressRouteReceiver> {
  const moduleExportsFromFile = await import(handlerPath)

  const lowLevelExpressRouteReceiver = extractRouteReceiverFromModuleExports(moduleExportsFromFile)
  if (lowLevelExpressRouteReceiver !== null) {
    return lowLevelExpressRouteReceiver
  }

  const pathActions = createActionsFromModuleExports(moduleExportsFromFile)
  return routeAssemblerForPathActions(pathActions)
}

async function loadActionsFromTextFile(handlerPath: string): Promise<ExpressRouteReceiver> {
  const fileAction = makeStaticFileAction(handlerPath)
  return routeAssemblerForPathActions(buildPathActions({ get: fileAction }))
}

export function extractRouteReceiverFromModuleExports(exports: any): ExpressRouteReceiver | null {
  // TODO: do we need to check for a naked module export?
  if (typeof exports.withExpressRoute === "function") {
    // TODO: check that the function has the right signature
    return exports.withExpressRoute as ExpressRouteReceiver
  } else {
    return null
  }
}

export function createActionsFromModuleExports(exports: any): PathActions {
  if (typeof exports === "function") {
    return buildPathActions({ get: normalizeImportedAction(exports) })
  }

  // TODO: warn if both get and default were exported
  const get = normalizeImportedAction(exports.get || exports.default || null)
  const post = normalizeImportedAction(exports.post || null)
  const put = normalizeImportedAction(exports.put || null)
  const patch = normalizeImportedAction(exports.patch || null)
  // TODO: warn if both delete and delete_ were exported
  const delete_ = normalizeImportedAction(exports.delete || exports.delete_ || null)
  const options = normalizeImportedAction(exports.options || null)
  return { get, post, put, patch, delete: delete_, options }
}
