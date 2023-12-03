import { ActionContext } from "../../../../lib/types"

export default async function ({ pathParams }: ActionContext) {
  return {
    pathParams,
  }
}
