import * as path from 'path'
import essence from 'essence-framework'
import { createServer } from 'essence-framework'

const apiPath = path.join(__dirname, 'api')
essence(apiPath)

async function main() {
  const essenceServer = await createServer()
  essenceServer.registerPathActions(await import('./api'), '/')
  essenceServer.registerPathActions(
    await import('./api/users/:user_id'),
    '/users/:user_id'
  )

  await essenceServer.startServer()
}

main()
