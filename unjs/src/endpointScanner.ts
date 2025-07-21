import fs from "node:fs/promises"
import path from "node:path"
import { LoadedModule, loadEndpointModule } from "./endpointLoader.js"
import { HTTP_METHODS, type HttpMethods } from "./types.js"

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"] as const

export interface RouteInfo {
  sourcePath: string
  routePath: string
  handlers: Partial<Record<HttpMethods, Function>>
}

export interface ScanIssue {
  severity: "warn" | "error"
  filePath: string
  message: string
}

export interface ScanResult {
  routes: Map<string, RouteInfo>
  issues: ScanIssue[]
}

export async function scanSourceDirectory(
  sourceDir: string,
): Promise<ScanResult> {
  try {
    await fs.access(sourceDir)
  } catch {
    throw new Error(`Source directory does not exist: ${sourceDir}`)
  }

  const { routes, issues } = await scanDirectory(sourceDir, sourceDir)
  return { routes, issues }
}

interface ScanDirectoryResult {
  routes: Map<string, RouteInfo>
  issues: ScanIssue[]
}

async function scanDirectory(
  baseDir: string,
  currentDir: string,
): Promise<ScanDirectoryResult> {
  const routes = new Map<string, RouteInfo>()
  const issues: ScanIssue[] = []
  const entries = await fs.readdir(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const { routes: subRoutes, issues: subIssues } = await scanDirectory(
        baseDir,
        fullPath,
      )
      // Merge sub-directory results
      for (const [path, route] of subRoutes) {
        routes.set(path, route)
      }
      issues.push(...subIssues)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)

      if (SUPPORTED_EXTENSIONS.includes(ext as any)) {
        // Process TypeScript/TSX/JavaScript/JSX files
        const { routeInfo, issues: fileIssues } = await createRouteInfo(
          baseDir,
          fullPath,
        )
        if (routeInfo) {
          routes.set(routeInfo.routePath, routeInfo)
        }
        issues.push(...fileIssues)
      } else {
        // Warn about unrecognized file extensions
        if (ext && !entry.name.startsWith(".")) {
          issues.push({
            severity: "warn",
            filePath: fullPath,
            message: `Skipping file with unrecognized extension: ${fullPath}`,
          })
        }
      }
    }
  }

  return { routes, issues }
}

interface CreateRouteInfoResult {
  routeInfo: RouteInfo | null
  issues: ScanIssue[]
}

async function createRouteInfo(
  baseDir: string,
  filePath: string,
): Promise<CreateRouteInfoResult> {
  const relativePath = path.relative(baseDir, filePath)
  const routePath = filePathToRoutePath(relativePath)

  const { handlers, issues } = await extractHandlersFromFile(filePath)

  if (Object.keys(handlers).length === 0) {
    return { routeInfo: null, issues } // Skip files with no HTTP method exports
  }

  const routeInfo: RouteInfo = {
    sourcePath: relativePath,
    routePath,
    handlers,
  }

  return { routeInfo, issues }
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

interface ExtractHandlersResult {
  handlers: Partial<Record<HttpMethods, Function>>
  issues: ScanIssue[]
}

async function extractHandlersFromFile(
  filePath: string,
): Promise<ExtractHandlersResult> {
  let module: LoadedModule
  try {
    module = await loadEndpointModule(filePath)
  } catch (error) {
    const issues: ScanIssue[] = [
      {
        severity: "warn",
        filePath,
        message: `Failed to require file ${filePath}: ${error}`,
      },
    ]
    return { handlers: {}, issues }
  }

  // TODO: this implementation is a bit of a hot mess; loads of
  // special cases and error handling. It has really solid test coverage;
  // we should refactor it with tests as a safety net.

  const handlers: Partial<Record<HttpMethods, Function>> = {}
  const usedExports = new Set<string>()
  const conflictingExports = new Set<string>()
  const issues: ScanIssue[] = []
  let hasErrors = false

  // Check for HTTP method exports (both uppercase and lowercase)
  for (const method of HTTP_METHODS) {
    const lowercaseMethod = method.toLowerCase()
    const hasUppercase = module[method] && typeof module[method] === "function"
    const hasLowercase =
      module[lowercaseMethod] && typeof module[lowercaseMethod] === "function"

    // Check for conflicting case exports
    if (hasUppercase && hasLowercase) {
      issues.push({
        severity: "error",
        filePath,
        message: `Multiple exports for same HTTP method: has both '${method}' and '${lowercaseMethod}' exports. Use only one case format.`,
      })
      hasErrors = true
      // Mark both conflicting exports so we don't warn about them being unused
      conflictingExports.add(method)
      conflictingExports.add(lowercaseMethod)
      continue // Continue checking other methods for more errors
    }

    if (hasUppercase) {
      handlers[method] = module[method]
      usedExports.add(method)
    } else if (hasLowercase) {
      handlers[method] = module[lowercaseMethod]
      usedExports.add(lowercaseMethod)
    }
  }

  // Check for default export (treat as GET)
  if (module.default && typeof module.default === "function") {
    if (handlers.GET) {
      issues.push({
        severity: "error",
        filePath,
        message: `Conflicting export: has both a default export and a GET export. Use either a default export OR a GET export, not both.`,
      })
      hasErrors = true
      // Mark default as conflicting so we don't warn about it being unused
      conflictingExports.add("default")
    } else {
      handlers.GET = module.default
      usedExports.add("default")
    }
  }
  // Check for CommonJS module.exports = function() (entire module is a function)
  else if (typeof module === "function" && Object.keys(module).length === 0) {
    if (handlers.GET) {
      issues.push({
        severity: "error",
        filePath,
        message: `Conflicting export: has both a function export and a GET export. Use either a function export OR a GET export, not both.`,
      })
      hasErrors = true
      // Note: for CommonJS function exports, we don't need to mark anything as conflicting
      // since the entire module is the export and there are no named exports to warn about
    } else {
      handlers.GET = module
      // Don't add to usedExports since the entire module is the export
    }
  }

  // If we found errors, return empty handlers but continue to warn about unused exports
  if (hasErrors) {
    // Still warn about unused exports even if there are errors, but exclude conflicting exports
    const allExports = Object.keys(module)
    for (const exportName of allExports) {
      if (
        !usedExports.has(exportName) &&
        !conflictingExports.has(exportName) &&
        exportName !== "__esModule"
      ) {
        issues.push({
          severity: "warn",
          filePath,
          message: `Unused export '${exportName}' - only HTTP method functions are used as handlers`,
        })
      }
    }
    return { handlers: {}, issues }
  }

  // Warn about unused exports (only for user files, not node_modules)
  const allExports = Object.keys(module)
  for (const exportName of allExports) {
    if (
      !usedExports.has(exportName) &&
      !conflictingExports.has(exportName) &&
      exportName !== "__esModule"
    ) {
      issues.push({
        severity: "warn",
        filePath,
        message: `Unused export '${exportName}' - only HTTP method functions are used as handlers`,
      })
    }
  }

  // Check if module has no exports at all (only __esModule doesn't count)
  const hasAnyRealExports =
    allExports.length > 0 && !allExports.every((key) => key === "__esModule")

  if (!hasAnyRealExports) {
    issues.push({
      severity: "warn",
      filePath,
      message:
        "Module has no exports - only HTTP method functions are used as handlers",
    })
  }

  return { handlers, issues }
}
