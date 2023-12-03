import { ActionContext } from "../../../../../../../lib/types"

export default async function ({ pathParams, queryParams }: ActionContext) {
  return {
    pathParams,
    queryParams,
  }
}
