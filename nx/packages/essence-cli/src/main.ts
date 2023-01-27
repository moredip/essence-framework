require('ts-node/register')

import essence from 'essence-framework'

async function main(argv) {
  const targetDir = argv[2] || '.'

  const essenceServer = await essence(targetDir)
  await essenceServer.startServer()
}

main(process.argv)
