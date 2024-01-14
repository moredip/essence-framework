import { ActionContext } from "../../../../lib/types"

export default async function ({ pathParams }: ActionContext) {
  return <h1>Hello there, {pathParams.name}</h1>
}
