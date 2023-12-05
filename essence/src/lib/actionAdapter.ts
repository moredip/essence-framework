// makes an essence action handler look like an express handler

import { IRoute, Request, RequestHandler, Response } from "express"
import {
  ActionHandler,
  ActionContext,
  PathActions,
  HttpMethods,
  ExpressRouteReceiver,
} from "./types"
import { readFile } from "fs/promises"
import logger from "./logger"

function wrapActionHandler(actionHandler: ActionHandler): RequestHandler {
  async function expressHandler(req: Request, res: Response): Promise<void> {
    const context: ActionContext = {
      pathParams: req.params,
      queryParams: req.query,
    }
    const actionOutput = await actionHandler(context)
    convertActionOutputToExpressResponse(actionOutput, res)
  }

  return expressHandler
}

function convertActionOutputToExpressResponse(actionOutput: unknown, res: Response) {
  // TODO: improve our detection and handling of the myriad random things
  // that someone could choose to return from an action handler
  if (typeof actionOutput === "string") {
    return res.end(actionOutput)
  }

  if (Buffer.isBuffer(actionOutput)) {
    return res.end(actionOutput, "binary")
  }

  if (typeof actionOutput === "object") {
    const prettyJson = JSON.stringify(actionOutput, null, 2)
    return res.type("json").end(prettyJson)
  }
}

export function routeAssemblerForPathActions(pathActions: PathActions): ExpressRouteReceiver {
  const routeAssembler = function (route: IRoute) {
    HttpMethods.forEach((method) => {
      const pathAction = pathActions[method]
      if (pathAction) {
        logger.debug(`registering ${method.toUpperCase()} ${route.path}`)
        route[method](pathAction)
      }
    })
  }
  return routeAssembler
}

export function normalizeImportedAction(importedAction: any): RequestHandler | null {
  if (importedAction === null) {
    return null
  }
  if (typeof importedAction === "function") {
    return wrapActionHandler(importedAction)
  }
  if (typeof importedAction === "string" || typeof importedAction === "object") {
    return makeStaticValueAction(importedAction)
  }

  // TODO: raise clearer error explaining that the exported action is not a supported type
  throw new Error(`unexpected action shape: ${importedAction}`)
}

function makeStaticValueAction(staticValue: string | object): RequestHandler {
  return async (req: Request, res: Response) => {
    convertActionOutputToExpressResponse(staticValue, res)
  }
}

export function makeStaticFileAction(filePath: string) {
  return async (req: Request, res: Response) => {
    // note that we read the file contents inside this handler - rather
    // than in the outer function - so that our action instantly reflects
    // any changes to the static file
    const fileContents = await readFile(filePath)
    convertActionOutputToExpressResponse(fileContents, res)
  }
}
