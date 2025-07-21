import { createApp, createRouter, toNodeListener } from "h3"
import { createServer } from "node:http"
import path from "node:path"
import { scanSourceDirectory, RouteInfo, ScanIssue } from "./endpointScanner.js"
import { setupJSXRuntime } from "./endpointLoader.js"
import { createEndpointHandler } from "./endpointAdapter.js"
import { type HttpMethods, type HttpMethodsLowercase } from "./types.js"
import { FileWatcher } from "./fileWatcher.js"

export async function boot(
  sourceDir: string,
  options: { watch?: boolean } = {},
) {
  await setupJSXRuntime()

  const absoluteSourceDir = path.resolve(sourceDir)

  // Create h3 app
  const app = createApp()
  let currentRouter = await createRouterFromDirectory(absoluteSourceDir)
  app.use(currentRouter)

  const server = createServer(toNodeListener(app))

  // Set up file watcher if enabled
  if (options.watch !== false) {
    const watcher = new FileWatcher(absoluteSourceDir)

    watcher.on("changes", async () => {
      try {
        console.log("🔄 Rebuilding routes...")

        // Rebuild router (jiti caching is disabled so modules will be fresh)
        const newRouter = await createRouterFromDirectory(absoluteSourceDir)

        // Atomically swap the router
        app.stack.length = 0 // Clear existing middleware
        app.use(newRouter)

        console.log("✅ Routes updated successfully")
      } catch (error) {
        console.error("❌ Failed to update routes:", error)
      }
    })

    watcher.on("error", (error) => {
      console.error("File watcher error:", error)
    })

    watcher.start()

    // Clean up watcher on server close
    server.on("close", () => {
      watcher.stop()
    })
  }

  server.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000")
    if (options.watch !== false) {
      console.log(
        "👀 File watching enabled - changes will be applied automatically",
      )
    }
  })

  return server
}

function reportScannerOutcomes(
  sourceDir: string,
  routes: Map<string, RouteInfo>,
  issues: ScanIssue[],
) {
  // Log all errors first
  const errors = issues.filter((issue) => issue.severity === "error")
  for (const issue of errors) {
    const relativePath = path.join(
      path.basename(sourceDir),
      path.relative(sourceDir, issue.filePath),
    )
    console.error(`ERROR: ${relativePath}: ${issue.message}`)
  }

  // Then log all warnings
  const warnings = issues.filter((issue) => issue.severity === "warn")
  for (const issue of warnings) {
    const relativePath = path.join(
      path.basename(sourceDir),
      path.relative(sourceDir, issue.filePath),
    )
    console.warn(`WARNING: ${relativePath}: ${issue.message}`)
  }

  // Log route map
  console.log("\n📍 Route map:")
  for (const [routePath, routeInfo] of routes) {
    console.log(
      `  [${Object.keys(routeInfo.handlers).join(", ")}] ${routePath} (${routeInfo.sourcePath})`,
    )
  }
}

async function createRouterFromDirectory(sourceDir: string) {
  const { routes: routeMap, issues } = await scanSourceDirectory(sourceDir)

  reportScannerOutcomes(sourceDir, routeMap, issues)

  if (issues.some((issue) => issue.severity === "error")) {
    throw new Error("Failed to create router: error(s) found")
  }

  const router = createRouter()

  // Register routes from route map
  for (const [routePath, routeInfo] of routeMap) {
    for (const method of Object.keys(routeInfo.handlers) as HttpMethods[]) {
      const handler = routeInfo.handlers[method]

      if (!handler) continue

      const routerMethod = method.toLowerCase() as HttpMethodsLowercase

      router[routerMethod](routePath, createEndpointHandler(handler))
    }
  }

  return router
}
