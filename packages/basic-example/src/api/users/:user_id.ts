import { EssenceRequest } from 'essence-framework'

export async function get(req: EssenceRequest) {
  return `info about user ${req.params['user_id']}`
}
