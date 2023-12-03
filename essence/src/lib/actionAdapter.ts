// makes an essence action handler look like an express handler

import { Request, Response } from "express"
import { ActionHandler, ActionContext } from "./types"
import { readFile } from "fs/promises"

export function wrapActionHandler(actionHandler: ActionHandler) {
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

export function normalizeImportedAction(importedAction: any): ActionHandler | null {
  if (importedAction === null) {
    return null
  }
  if (typeof importedAction === "function") {
    return importedAction
  }
  if (typeof importedAction === "string" || typeof importedAction === "object") {
    return makeStaticValueAction(importedAction)
  }

  // TODO: raise clearer error explaining that the exported action is not a supported type
  throw new Error(`unexpected action shape: ${importedAction}`)
}

function makeStaticValueAction(staticValue: string | object) {
  return async () => {
    return staticValue
  }
}

export function makeStaticFileAction(filePath: string) {
  return async () => {
    const fileContents = await readFile(filePath)
    return fileContents
  }
}
