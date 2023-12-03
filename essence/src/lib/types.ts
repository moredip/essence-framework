import { ParsedQs } from "qs"

export type ActionContext = {
  pathParams: Record<string, string>
  queryParams: ParsedQs

  // TODO: body, rawBody, headers, cookies, etc. etc.
}

export type ActionHandler = (context: ActionContext) => Promise<unknown>
export type PathActions = {
  get: ActionHandler | null
  post: ActionHandler | null
  put: ActionHandler | null
  patch: ActionHandler | null
  delete: ActionHandler | null
  options: ActionHandler | null
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
