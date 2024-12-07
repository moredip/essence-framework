import { IRoute, RequestHandler } from "express"
import { ParsedQs } from "qs"

export type ActionContext = {
  pathParams: Record<string, string>
  queryParams: ParsedQs
  requestBody: any
  response: any

  // TODO: body, rawBody, headers, cookies, etc. etc.
}

export type ExpressRouteReceiver = (route: IRoute) => void
export const NoopRouteReceiver: ExpressRouteReceiver = (route: IRoute) => {}

export const HttpMethods = ["get", "post", "put", "patch", "delete", "options"] as const

export type ActionHandler = (context: ActionContext) => Promise<unknown>
export type PathActions = {
  get: RequestHandler | null
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
