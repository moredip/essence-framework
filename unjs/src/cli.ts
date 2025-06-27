import { createApp, createRouter, toNodeListener } from "h3"
import { createServer } from "node:http"
import path from "node:path"
import { renderSSR } from "nano-jsx"
import { scanSourceDirectory, type HttpMethod } from "./scanner"

type RouterMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options'

function isJSXElement(value: any): boolean {
  return value && typeof value === 'object' && value.type && (value.props !== undefined)
}

async function processResponse(result: any, event: any) {
  if (isJSXElement(result)) {
    // Render JSX to HTML
    const html = renderSSR(result)
    event.node.res.setHeader('content-type', 'text/html')
    return html
  } else if (typeof result === 'object' && result !== null) {
    // JSON response
    event.node.res.setHeader('content-type', 'application/json')
    return JSON.stringify(result)
  } else {
    // String or other response
    event.node.res.setHeader('content-type', 'text/plain')
    return String(result)
  }
}

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
          return await processResponse(result, event)
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
