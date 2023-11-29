export type EssenceRequest = {
  params: Record<string, string>
}

export type ActionHandler = (req: EssenceRequest) => Promise<unknown>
export type PathActions = {
  get: ActionHandler | null
  post: ActionHandler | null
}
