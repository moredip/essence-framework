import * as path from 'path'
//import essence from 'essence-framework'
import { createServer } from 'essence-framework'
import { create } from 'domain'

const apiPath = path.join(__dirname, 'api')

async function main() {
  const essenceServer = await createServer()
  essenceServer.registerPathActions(await import('./api'), '/')

  await essenceServer.startServer()
}

main()
