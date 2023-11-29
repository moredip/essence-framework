// import { EssenceRequest } from 'essence-framework'

export async function get(req: any) {
  return `info about user ${req.params['user_id']}`
}
