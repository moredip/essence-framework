import fs from "node:fs/promises"
import path from "node:path"
import { loadEndpointModule } from "./endpointLoader"
import { HTTP_METHODS, type HttpMethods } from "./types"

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"] as const

export interface RouteInfo {
  sourcePath: string
  routePath: string
  handlers: Partial<Record<HttpMethods, Function>>
}

export async function scanSourceDirectory(
  sourceDir: string,
): Promise<Map<string, RouteInfo>> {
  console.log(`Scanning source directory: ${sourceDir}`)
  const routeMap = new Map<string, RouteInfo>()

  try {
    await fs.access(sourceDir)
  } catch {
    throw new Error(`Source directory does not exist: ${sourceDir}`)
  }

  await scanDirectory(sourceDir, sourceDir, routeMap)
  return routeMap
}

async function scanDirectory(
  baseDir: string,
  currentDir: string,
  routeMap: Map<string, RouteInfo>,
) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      await scanDirectory(baseDir, fullPath, routeMap)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)

      if (SUPPORTED_EXTENSIONS.includes(ext as any)) {
        // Process TypeScript/TSX/JavaScript/JSX files
        const routeInfo = await createRouteInfo(baseDir, fullPath)
        if (routeInfo) {
          routeMap.set(routeInfo.routePath, routeInfo)
        }
      } else {
        // Warn about unrecognized file extensions
        if (ext && !entry.name.startsWith(".")) {
          console.warn(`Skipping file with unrecognized extension: ${fullPath}`)
        }
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
    sourcePath: relativePath,
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
): Promise<Partial<Record<HttpMethods, Function>>> {
  try {
    const module = await loadEndpointModule(filePath)
    const handlers: Partial<Record<HttpMethods, Function>> = {}
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
    const allExports = Object.keys(module)
    for (const exportName of allExports) {
      if (!usedExports.has(exportName) && exportName !== "__esModule") {
        console.warn(
          `Unused export '${exportName}' in ${filePath} - only HTTP method functions are used as handlers`,
        )
      }
    }

    return handlers
  } catch (error) {
    console.warn(`Failed to require file ${filePath}:`, error)
    return {}
  }
}
