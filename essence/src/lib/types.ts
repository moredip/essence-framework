import { RequestHandler } from "express"
import { ParsedQs } from "qs"

export type ActionContext = {
  pathParams: Record<string, string>
  queryParams: ParsedQs

  // TODO: body, rawBody, headers, cookies, etc. etc.
}

export type ActionHandler = (context: ActionContext) => Promise<unknown>
export type PathActions = {
  get?: RequestHandler | null
  post: RequestHandler | null
  put: RequestHandler | null
  patch: RequestHandler | null
  delete: RequestHandler | null
  options: RequestHandler | null
}
export function buildPathActions(specificActions: Partial<PathActions>): PathActions {
  return {
    get: null,
    post: null,
    put: null,
    patch: null,
    delete: null,
    options: null,
    ...specificActions,
  }
}
