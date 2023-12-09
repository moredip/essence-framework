import essence from "../lib/entryPoint"

require("ts-node/register")

export default async function main(argv: string[]) {
  const targetDir = argv[2] || "."

  const essenceServer = await essence(targetDir)
  await essenceServer.startServer()
}
