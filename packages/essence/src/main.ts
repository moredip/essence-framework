require('ts-node/register')

import * as path from 'path'
import { autoDiscover } from './autoDiscovery'

export default async function main(argv: string[]) {
  // console.log('Hello World!')

  const targetDir = argv[2] || '.'
  const absTargetDir = path.resolve(targetDir)

  await autoDiscover(path.resolve(absTargetDir, 'api'))
}

main(process.argv)
