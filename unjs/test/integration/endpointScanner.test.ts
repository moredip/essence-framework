import path from "node:path"
import { scanSourceDirectory } from "../../src/endpointScanner"
import "jest-extended"

describe("endpointScanner integration", () => {
  const fixtureDir = path.join(__dirname, "fixtures", "simple")

  it("should scan directory and discover all expected routes", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

    expect([...routeMap.keys()]).toIncludeSameMembers([
      "/default-export",
      "/hello",
      "/jsx-page",
      "/lowercase",
      "/typed",
      "/users",
      "/users/profile",
    ])
  })

  it("should handle JS file with named export", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

    const helloRoute = routeMap.get("/hello")
    expect(helloRoute).toMatchObject({
      sourcePath: "hello.js",
      routePath: "/hello",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })
    expect(helloRoute?.handlers.GET?.()).toEqual({ message: "Hello, world!" })
  })

  it("should handle TypeScript file with multiple HTTP methods", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

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
    const postResult = typedRoute?.handlers.POST?.()
    expect(postResult).toEqual("I created a user!")
  })

  it("should handle TSX file with JSX return", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

    const jsxRoute = routeMap.get("/jsx-page")
    expect(jsxRoute).toMatchObject({
      sourcePath: "jsx-page.tsx",
      routePath: "/jsx-page",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })
  })

  it("should handle default export mapped to GET", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

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

  it("should fail when a module has both a default export and a GET export", async () => {
    const conflictingFixtureDir = path.join(
      __dirname,
      "fixtures",
      "conflicting-exports",
    )

    await expect(scanSourceDirectory(conflictingFixtureDir)).rejects.toThrow(
      "Conflicting export",
    )
  })

  it("should handle lowercase HTTP method names", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

    const lowercaseRoute = routeMap.get("/lowercase")
    expect(lowercaseRoute).toMatchObject({
      sourcePath: "lowercase.js",
      routePath: "/lowercase",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
        POST: expect.toBeFunction(),
        PUT: expect.toBeFunction(),
      }),
    })

    expect(lowercaseRoute?.handlers.GET?.()).toBe("Hello from lowercase get")
    expect(lowercaseRoute?.handlers.POST?.()).toBe(
      "Created from lowercase post",
    )
    expect(lowercaseRoute?.handlers.PUT?.()).toBe("Updated from lowercase put")
  })

  it("should fail when a module has multiple exports for the same HTTP method", async () => {
    const multipleMethodsFixtureDir = path.join(
      __dirname,
      "fixtures",
      "multiple-methods",
    )

    await expect(
      scanSourceDirectory(multipleMethodsFixtureDir),
    ).rejects.toThrow("Multiple exports")
  })

  it("should handle index files mapping to parent directory route", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

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
  })

  it("should handle nested file routing", async () => {
    const routeMap = await scanSourceDirectory(fixtureDir)

    const profileRoute = routeMap.get("/users/profile")
    expect(profileRoute).toMatchObject({
      sourcePath: "users/profile.js",
      routePath: "/users/profile",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })
  })

  it.todo("ignores files with an unrecognized extension")

  it.todo("warns about exports with non-standard names")

  it.todo("warns about modules with no exports")

  it("should handle commonJS modules with named and default exports", async () => {
    const commonjsFixtureDir = path.join(__dirname, "fixtures", "commonjs")

    const routeMap = await scanSourceDirectory(commonjsFixtureDir)

    expect([...routeMap.keys()]).toIncludeSameMembers([
      "/cjs-named",
      "/cjs-default",
      "/cjs-mixed",
    ])

    // CommonJS named exports
    const cjsNamedRoute = routeMap.get("/cjs-named")
    expect(cjsNamedRoute).toMatchObject({
      sourcePath: "cjs-named.js",
      routePath: "/cjs-named",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
        POST: expect.toBeFunction(),
      }),
    })

    // CommonJS default export (should map to GET)
    const cjsDefaultRoute = routeMap.get("/cjs-default")
    expect(cjsDefaultRoute).toMatchObject({
      sourcePath: "cjs-default.js",
      routePath: "/cjs-default",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })

    // Mixed CommonJS and ES6 exports in TypeScript
    const cjsMixedRoute = routeMap.get("/cjs-mixed")
    expect(cjsMixedRoute).toMatchObject({
      sourcePath: "cjs-mixed.ts",
      routePath: "/cjs-mixed",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
        POST: expect.toBeFunction(),
        PUT: expect.toBeFunction(),
      }),
    })
    expect(cjsMixedRoute?.handlers.GET?.()).toBe(
      "Hello from TypeScript CommonJS GET",
    )
    expect(cjsMixedRoute?.handlers.POST?.()).toBe(
      "Hello from TypeScript ES6 POST",
    )
    expect(cjsMixedRoute?.handlers.PUT?.()).toBe(
      "Hello from TypeScript CommonJS PUT",
    )
  })
})
