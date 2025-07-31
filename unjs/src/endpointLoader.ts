import { createJiti } from "jiti"
import { h, renderSSR, Fragment } from "nano-jsx"

import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)

export interface LoadedModule {
  [key: string]: any
}

// Create jiti instance at module evaluation time with caching disabled
const jiti = createJiti(__filename, {
  moduleCache: false, // Disable caching so modules are always fresh
  jsx: {
    runtime: "classic",
    pragma: "__ESSENCE_PROVIDED_NANO__H__",
    pragmaFrag: "__ESSENCE_PROVIDED_NANO__FRAGMENT__",
  },
})

/**
 * Loads and transpiles TypeScript/JavaScript/JSX files at runtime
 * with support for nano-jsx SSR rendering
 */
export async function loadEndpointModule(
  filePath: string,
): Promise<LoadedModule> {
  return await jiti.import<LoadedModule>(filePath)
}

/**
 * Initialize nano-jsx for server-side rendering and set up global JSX functions
 * Should be called once at application startup
 */
export async function setupJSXRuntime(): Promise<void> {
  // hacky way to get nano to setup `global.document`, which needs to be done
  // before any JSX is loaded
  renderSSR(null)

  // Make nano-jsx functions available with unique global names
  ;(global as any).__ESSENCE_PROVIDED_NANO__H__ = h
  ;(global as any).__ESSENCE_PROVIDED_NANO__FRAGMENT__ = Fragment
}
