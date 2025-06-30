import path from "node:path"
import { scanSourceDirectory } from "../../src/endpointScanner"
import "jest-extended"

describe("endpointScanner integration", () => {
  const fixtureDir = path.join(__dirname, "fixtures", "simple")

  it("should scan a directory with multiple file types", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

    expect(routeMap.size).toBe(6)

    // JS file with named export
    const helloRoute = routeMap.get("/hello")
    expect(helloRoute).toMatchObject({
      sourcePath: "hello.js",
      routePath: "/hello",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })
    expect(helloRoute?.handlers.GET?.()).toEqual({ message: "Hello, world!" })

    // TypeScript file with multiple HTTP methods
    const typedRoute = routeMap.get("/typed")
    expect(typedRoute).toMatchObject({
      sourcePath: "typed.ts",
      routePath: "/typed",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
        POST: expect.toBeFunction(),
      }),
    })
    expect(typedRoute?.handlers.GET?.()).toBe("Hello from TypeScript, age 15")

    // TSX file with JSX return
    const jsxRoute = routeMap.get("/jsx-page")
    expect(jsxRoute).toMatchObject({
      sourcePath: "jsx-page.tsx",
      routePath: "/jsx-page",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })

    // Default export mapped to GET
    const defaultRoute = routeMap.get("/default-export")
    expect(defaultRoute).toMatchObject({
      sourcePath: "default-export.js",
      routePath: "/default-export",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })
    expect(defaultRoute?.handlers.GET?.()).toBe("Hello from default export")
  })

  it("should handle nested directories and index files", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

    // Index file should map to parent directory route
    const usersIndexRoute = routeMap.get("/users")
    expect(usersIndexRoute).toMatchObject({
      sourcePath: "users/index.js",
      routePath: "/users",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
        POST: expect.toBeFunction(),
      }),
    })
    expect(usersIndexRoute?.handlers.GET?.()).toEqual({
      users: ["alice", "bob"],
    })

    // Nested file should map to nested route
    const profileRoute = routeMap.get("/users/profile")
    expect(profileRoute).toMatchObject({
      sourcePath: "users/profile.js",
      routePath: "/users/profile",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })
  })

  it("should handle files with multiple HTTP methods", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

    const typedRoute = routeMap.get("/typed")
    expect(typedRoute?.handlers).toMatchObject({
      GET: expect.toBeFunction(),
      POST: expect.toBeFunction(),
    })

    // Test both methods work
    expect(typedRoute?.handlers.GET?.()).toBe("Hello from TypeScript, age 15")
    const postResult = typedRoute?.handlers.POST?.({
      context: { body: { name: "test" } },
    })
    expect(postResult).toEqual({
      message: "Created user",
      data: { name: "test" },
    })
  })
})
