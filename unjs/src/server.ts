import { createApp, createRouter, toNodeListener } from "h3"
import { createServer } from "node:http"
import path from "node:path"
import { scanSourceDirectory } from "./endpointScanner"
import { setupJSXRuntime } from "./endpointLoader"
import { createEndpointHandler } from "./endpointAdapter"
import { type HttpMethods, type HttpMethodsLowercase } from "./types"

export async function boot(sourceDir: string) {
  await setupJSXRuntime()

  const absoluteSourceDir = path.resolve(sourceDir)
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
    for (const method of Object.keys(routeInfo.handlers) as HttpMethods[]) {
      const handler = routeInfo.handlers[method]

      if (!handler) continue

      const routerMethod = method.toLowerCase() as HttpMethodsLowercase

      router[routerMethod](routePath, createEndpointHandler(handler))
    }
  }

  app.use(router)

  const server = createServer(toNodeListener(app))

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000")
  })

  return server
}
