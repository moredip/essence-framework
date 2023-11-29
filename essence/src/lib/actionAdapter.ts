// makes an essence action handler look like an express handler

import { Request, Response } from "express"
import { ActionHandler, EssenceRequest } from "./types"

export function wrapActionHandler(actionHandler: ActionHandler) {
  async function expressHandler(req: Request, res: Response): Promise<void> {
    const essenceRequest: EssenceRequest = {
      params: req.params,
    }
    const actionOutput = await actionHandler(essenceRequest)
    convertActionOutputToExpressResponse(actionOutput, res)
  }

  return expressHandler
}

function convertActionOutputToExpressResponse(actionOutput: unknown, res: Response) {
  // TODO: improve our detection and handling of the myriad random things
  // that someone could choose to return from an action handler
  if (typeof actionOutput === "string") {
    return res.end(actionOutput)
  } else if (typeof actionOutput === "object") {
    const prettyJson = JSON.stringify(actionOutput, null, 2)
    return res.type("json").end(prettyJson)
  }
}
