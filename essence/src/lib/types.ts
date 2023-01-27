export type EssenceRequest = {
  params: Record<string, string>
}

export type ActionOutput = string // todo: handle objects for json result
export type ActionHandler = (req: EssenceRequest) => Promise<ActionOutput>
export type PathActions = {
  get: ActionHandler | null
  post: ActionHandler | null
}
