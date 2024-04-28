import * as path from "path"
import * as walk from "walkdir"
import { loadActionsFromFile } from "./actionImporter"
import logger from "./logger"
import { RegisterRoutesFn } from "./router"

export async function autoDiscover(apiRootPath: string, registerRoutes: RegisterRoutesFn) {
  logger.info("\nbuilding routes for " + apiRootPath)
  const routePath = routePathWithBase(apiRootPath)
  const handlerPaths = await walk.async(apiRootPath, { return_object: true })

  for (const [handlerPath, stats] of Object.entries(handlerPaths)) {
    if (!stats.isFile()) {
      continue
    }

    const route = routePath(handlerPath)
    logger.info("҂ " + route)

    logger.debug("loading action path: " + handlerPath)
    const routeReceiver = await loadActionsFromFile(handlerPath)
    registerRoutes(routeReceiver, route)
  }
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
