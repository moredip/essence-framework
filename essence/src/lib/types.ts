export type EssenceRequest = {
  params: Record<string, string>
}

export type ActionHandler = (req: EssenceRequest) => Promise<unknown>
export type PathActions = {
  get: ActionHandler | null
  post: ActionHandler | null
  put: ActionHandler | null
  patch: ActionHandler | null
  delete: ActionHandler | null
  options: ActionHandler | null
}
export const BLANK_PATH_ACTIONS: PathActions = {
  get: null,
  post: null,
  put: null,
  patch: null,
  delete: null,
  options: null,
}
