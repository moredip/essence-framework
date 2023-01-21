import essence from './lib/entryPoint'
import { createServer } from './lib/server'
import { autoDiscover } from './lib/autoDiscovery'

export default essence
export { autoDiscover, createServer }
export * from './lib/types'
