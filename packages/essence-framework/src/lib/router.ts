import * as path from 'path'
import { Router, Express } from 'express'
import { PathActions } from './types'
import { wrapActionHandler } from './actionAdapter'

export function createRouter(expressApp: Express) {
  const expressRouter = Router()
  expressApp.use('/', expressRouter)

  function registerPathActions(pathActions: PathActions, routePath: string) {
    if (pathActions.get) {
      expressRouter.get(routePath, wrapActionHandler(pathActions.get))
    }

    if (pathActions.post) {
      expressRouter.post(routePath, wrapActionHandler(pathActions.post))
    }
  }

  return {
    registerPathActions,
  }
}
