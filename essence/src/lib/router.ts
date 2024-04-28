import { Router, Express, json, urlencoded } from "express"
import { ExpressRouteReceiver } from "./types"

export type RegisterRoutesFn = (registerRoute: ExpressRouteReceiver, routePath: string) => void

export function createRouter(expressApp: Express): {
  registerPathActions: RegisterRoutesFn
} {
  const expressRouter = Router()
  expressApp.use("/", expressRouter)

  expressApp.use(json())
  expressApp.use(urlencoded({extended: true}))

  function registerPathActions(assembleRoutes: ExpressRouteReceiver, routePath: string) {
    const route = expressApp.route(routePath)
    assembleRoutes(route)
  }

  return {
    registerPathActions,
  }
}
