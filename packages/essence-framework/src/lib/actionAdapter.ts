// makes an essence action handler look like an express handler

import { Request, Response } from 'express'
import { ActionHandler, EssenceRequest } from './types'

export function wrapActionHandler(actionHandler: ActionHandler) {
  function expressHandler(req: Request, res: Response) {
    const essenceRequest: EssenceRequest = {
      params: {},
    }
    actionHandler(essenceRequest).then((actionOutput: string) => {
      res.end(actionOutput)
    })
  }

  return expressHandler
}
