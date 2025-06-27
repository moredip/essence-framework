import { createApp, createRouter, toNodeListener } from "h3"
import { createServer } from "node:http"
import path from "node:path"
import { scanSourceDirectory, type HttpMethod } from "./scanner"

type RouterMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options'

// Get source directory from command line args
const sourceDir = process.argv[2] || "./src"
const absoluteSourceDir = path.resolve(sourceDir)

async function main() {
  console.log(`Scanning source directory: ${absoluteSourceDir}`)

  // Scan for route files
  const routeMap = await scanSourceDirectory(absoluteSourceDir)

  console.log("Route map:")
  for (const [routePath, routeInfo] of routeMap) {
    console.log(
      `  ${routePath} -> ${routeInfo.filePath} [${Object.keys(routeInfo.handlers).join(", ")}]`,
    )
  }

  // Create h3 app and router
  const app = createApp()
  const router = createRouter()

  // Register routes from route map
  for (const [routePath, routeInfo] of routeMap) {
    for (const method of Object.keys(routeInfo.handlers) as HttpMethod[]) {
      const handler = routeInfo.handlers[method]
      
      if (!handler) continue

      const routerMethod = method.toLowerCase() as RouterMethod

      router[routerMethod](routePath, async (event) => {
        try {
          const result = await handler()
          return result
        } catch (error) {
          console.error(`Error handling ${method} ${routePath}:`, error)
          return "Internal server error"
        }
      })
    }
  }

  app.use(router)

  const server = createServer(toNodeListener(app))

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
  })
}

main().catch(console.error)
