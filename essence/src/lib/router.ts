import { Router, Express } from "express"
import { ExpressRouteReceiver, PathActions } from "./types"
import logger from "./logger"

export type RegisterRoutesFn = (registerRoute: ExpressRouteReceiver, routePath: string) => void

export function createRouter(expressApp: Express): {
  registerPathActions: RegisterRoutesFn
} {
  const expressRouter = Router()
  expressApp.use("/", expressRouter)

  function registerPathActions(assembleRoutes: ExpressRouteReceiver, routePath: string) {
    const route = expressApp.route(routePath)
    assembleRoutes(route)
  }

  return {
    registerPathActions,
  }
}
