import fs from "node:fs"
import path from "node:path"
import { createJiti } from "jiti"

export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
] as const

export type HttpMethod = (typeof HTTP_METHODS)[number]

export interface RouteInfo {
  filePath: string
  routePath: string
  handlers: Partial<Record<HttpMethod, Function>>
}

export async function scanSourceDirectory(
  sourceDir: string,
): Promise<Map<string, RouteInfo>> {
  const routeMap = new Map<string, RouteInfo>()

  if (!fs.existsSync(sourceDir)) {
    console.warn(`Source directory does not exist: ${sourceDir}`)
    return routeMap
  }

  await scanDirectory(sourceDir, sourceDir, routeMap)
  return routeMap
}

async function scanDirectory(
  baseDir: string,
  currentDir: string,
  routeMap: Map<string, RouteInfo>,
) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      await scanDirectory(baseDir, fullPath, routeMap)
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") ||
        entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".js") ||
        entry.name.endsWith(".jsx"))
    ) {
      // Process TypeScript/TSX/JavaScript/JSX files
      const routeInfo = await createRouteInfo(baseDir, fullPath)
      if (routeInfo) {
        routeMap.set(routeInfo.routePath, routeInfo)
      }
    }
  }
}

async function createRouteInfo(
  baseDir: string,
  filePath: string,
): Promise<RouteInfo | null> {
  // Convert file path to route path
  const relativePath = path.relative(baseDir, filePath)
  const routePath = filePathToRoutePath(relativePath)

  // Extract handlers from file
  const handlers = await extractHandlersFromFile(filePath)

  if (Object.keys(handlers).length === 0) {
    return null // Skip files with no HTTP method exports
  }

  return {
    filePath,
    routePath,
    handlers,
  }
}

function filePathToRoutePath(relativePath: string): string {
  // Remove file extension
  const withoutExt = relativePath.replace(/\.(ts|tsx|js|jsx)$/, "")

  // Convert to route path
  let routePath = "/" + withoutExt.replace(/\\/g, "/") // Handle Windows paths

  // Convert index files to root paths
  routePath = routePath.replace(/\/index$/, "") || "/"

  return routePath
}

async function extractHandlersFromFile(
  filePath: string,
): Promise<Partial<Record<HttpMethod, Function>>> {
  try {
    // Use jiti for runtime TypeScript transpilation
    const jiti = createJiti(__filename)
    const module = await jiti.import<Record<string, any>>(filePath)
    const handlers: Partial<Record<HttpMethod, Function>> = {}
    const usedExports = new Set<string>()

    // Check for HTTP method exports
    for (const method of HTTP_METHODS) {
      if (module[method] && typeof module[method] === "function") {
        handlers[method] = module[method]
        usedExports.add(method)
      }
    }

    // Check for default export (treat as GET)
    if (module.default && typeof module.default === "function") {
      if (!handlers.GET) {
        handlers.GET = module.default
        usedExports.add("default")
      }
    }

    // Warn about unused exports (only for user files, not node_modules)
    if (!filePath.includes("node_modules")) {
      const allExports = Object.keys(module)
      for (const exportName of allExports) {
        if (!usedExports.has(exportName) && exportName !== "__esModule") {
          console.warn(
            `Unused export '${exportName}' in ${filePath} - only HTTP method functions are used as handlers`,
          )
        }
      }
    }

    return handlers
  } catch (error) {
    console.warn(`Failed to require file ${filePath}:`, error)
    return {}
  }
}
