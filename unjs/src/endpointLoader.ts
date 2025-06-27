import { createJiti } from "jiti"
import { h, renderSSR, Fragment } from "nano-jsx"

export interface LoadedModule {
  [key: string]: any
}

/**
 * Loads and transpiles TypeScript/JavaScript/JSX files at runtime
 * with support for nano-jsx SSR rendering
 */
export async function loadEndpointModule(
  filePath: string,
): Promise<LoadedModule> {
  // Use jiti for runtime TypeScript transpilation with JSX support
  const jiti = createJiti(__filename, {
    jsx: {
      runtime: "classic",
      pragma: "__ESSENCE_PROVIDED_NANO__H__",
      pragmaFrag: "__ESSENCE_PROVIDED_NANO__FRAGMENT__",
    },
  })

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
