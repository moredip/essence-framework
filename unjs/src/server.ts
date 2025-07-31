import { App, createApp, createRouter, toNodeListener } from "h3"
import { createServer, Server } from "node:http"
import path from "node:path"
import openBrowser from "react-dev-utils/openBrowser.js"
import { scanSourceDirectory, RouteInfo, ScanIssue } from "./endpointScanner.js"
import { setupJSXRuntime } from "./endpointLoader.js"
import { createEndpointHandler } from "./endpointAdapter.js"
import { type HttpMethods, type HttpMethodsLowercase } from "./types.js"
import { FileWatcher } from "./fileWatcher.js"
import { refreshDevConsole } from "./devConsole.js"

export type ServerOptions = {
  watch: boolean
  console: boolean
  openBrowser: boolean
}

export async function boot(sourceDir: string, options: ServerOptions) {
  await setupJSXRuntime()

  const absoluteSourceDir = path.resolve(sourceDir)
  const port = 3000
  const serverUrl = `http://localhost:${port}`

  const app = await createAppFromSourceDirectory(
    absoluteSourceDir,
    options.console,
    serverUrl,
  )
  const server = createServer(toNodeListener(app))

  if (options.watch) {
    setupFileWatcher(absoluteSourceDir, app, options.console, server, serverUrl)
  }

  server.listen(port, () => {
    if (!options.console) {
      console.log(`🚀 Server running on ${serverUrl}`)
      if (options.watch) {
        console.log(
          "👀 File watching enabled - changes will be applied automatically",
        )
      }
    }

    if (options.openBrowser) {
      openBrowser(serverUrl)
    }
  })

  return server
}

function setupFileWatcher(
  absoluteSourceDir: string,
  app: App,
  useConsole: boolean,
  server: Server,
  serverUrl: string,
) {
  const watcher = new FileWatcher(absoluteSourceDir)

  watcher.on("changes", async () => {
    try {
      if (!useConsole) {
        console.log("🔄 Rebuilding routes...")
      }

      // Rebuild router (jiti caching is disabled so modules will be fresh)
      const routerResult = await createRouterFromDirectory(
        absoluteSourceDir,
        useConsole,
        serverUrl,
      )
      const newRouter = routerResult.router

      // Atomically swap the router
      app.stack.length = 0 // Clear existing middleware
      app.use(newRouter)

      if (!useConsole) {
        console.log("✅ Routes updated successfully")
      }
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

// exported only for testing purposes; not part of public API
export async function createAppFromSourceDirectory(
  absoluteSourceDir: string,
  useConsole: boolean,
  serverUrl: string,
): Promise<App> {
  const app = createApp()
  const routerResult = await createRouterFromDirectory(
    absoluteSourceDir,
    useConsole,
    serverUrl,
  )
  let currentRouter = routerResult.router
  app.use(currentRouter)
  return app
}

async function createRouterFromDirectory(
  sourceDir: string,
  useConsole = false,
  serverUrl: string,
) {
  const { routes: routeMap, issues } = await scanSourceDirectory(sourceDir)

  if (useConsole) {
    const consoleState = {
      routes: routeMap,
      issues,
      sourceDir,
      serverUrl,
    }
    refreshDevConsole(consoleState)
  } else {
    reportScannerOutcomes(sourceDir, routeMap, issues)
  }

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

  return { router, routes: routeMap, issues }
}
