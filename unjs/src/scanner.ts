import fs from "node:fs"
import path from "node:path"

export interface RouteInfo {
  filePath: string
  routePath: string
  methods: string[]
}

export function scanSourceDirectory(sourceDir: string): Map<string, RouteInfo> {
  const routeMap = new Map<string, RouteInfo>()

  if (!fs.existsSync(sourceDir)) {
    console.warn(`Source directory does not exist: ${sourceDir}`)
    return routeMap
  }

  scanDirectory(sourceDir, sourceDir, routeMap)
  return routeMap
}

function scanDirectory(baseDir: string, currentDir: string, routeMap: Map<string, RouteInfo>) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      scanDirectory(baseDir, fullPath, routeMap)
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      // Process TypeScript/TSX files
      const routeInfo = createRouteInfo(baseDir, fullPath)
      if (routeInfo) {
        routeMap.set(routeInfo.routePath, routeInfo)
      }
    }
  }
}

function createRouteInfo(baseDir: string, filePath: string): RouteInfo | null {
  // Convert file path to route path
  const relativePath = path.relative(baseDir, filePath)
  const routePath = filePathToRoutePath(relativePath)

  // Extract HTTP methods from file
  const methods = extractMethodsFromFile(filePath)

  if (methods.length === 0) {
    return null // Skip files with no HTTP method exports
  }

  return {
    filePath,
    routePath,
    methods,
  }
}

function filePathToRoutePath(relativePath: string): string {
  // Remove file extension
  const withoutExt = relativePath.replace(/\.(ts|tsx)$/, "")

  // Convert to route path
  let routePath = "/" + withoutExt.replace(/\\/g, "/") // Handle Windows paths

  // Convert index files to root paths
  routePath = routePath.replace(/\/index$/, "") || "/"

  return routePath
}

function extractMethodsFromFile(filePath: string): string[] {
  try {
    const module = require(filePath)
    const methods: string[] = []

    // Check for default export (treat as GET)
    if (module.default) {
      methods.push("GET")
    }

    return methods
  } catch (error) {
    console.warn(`Failed to require file ${filePath}:`, error)
    return []
  }
}
