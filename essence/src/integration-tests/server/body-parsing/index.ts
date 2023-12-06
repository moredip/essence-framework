import { ActionContext } from "../../../lib/types"

export function post({ requestBody }: ActionContext) {
  return {
    parsedBody: requestBody,
  }
}
