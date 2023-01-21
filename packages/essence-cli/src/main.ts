require('ts-node/register')

import * as path from 'path'
import createRunner from './runner'

function main(argv) {
  const targetDir = argv[2] || '.'
  const absTargetDir = path.resolve(targetDir)

  const runner = createRunner(absTargetDir)
  runner.run()
}

main(process.argv)
