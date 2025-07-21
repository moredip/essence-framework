import path from "node:path"
import { fileURLToPath } from "node:url"
import { scanSourceDirectory } from "../../src/endpointScanner"
import "jest-extended"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe("endpointScanner integration", () => {
  const fixtureDir = path.join(__dirname, "fixtures", "simple")

  it("should scan directory and discover all expected routes", async () => {
    const { routes, issues } = await scanSourceDirectory(fixtureDir)

    expect([...routes.keys()]).toIncludeSameMembers([
      "/default-export",
      "/hello",
      "/jsx-page",
      "/lowercase",
      "/non-standard-exports",
      "/typed",
      "/users",
      "/users/profile",
    ])

    const errorIssues = issues.filter((issue) => issue.severity === "error")
    expect(errorIssues).toHaveLength(0)
  })

  it("should handle JS file with named export", async () => {
    const { routes } = await scanSourceDirectory(fixtureDir)

    const helloRoute = routes.get("/hello")
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
    const { routes } = await scanSourceDirectory(fixtureDir)

    const typedRoute = routes.get("/typed")
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
    const { routes } = await scanSourceDirectory(fixtureDir)

    const jsxRoute = routes.get("/jsx-page")
    expect(jsxRoute).toMatchObject({
      sourcePath: "jsx-page.tsx",
      routePath: "/jsx-page",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })
  })

  it("should handle default export mapped to GET", async () => {
    const { routes } = await scanSourceDirectory(fixtureDir)

    const defaultRoute = routes.get("/default-export")
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

    const { routes, issues } = await scanSourceDirectory(conflictingFixtureDir)

    expect(routes.size).toBe(0)

    // Should have zero warning issues
    const warningIssues = issues.filter((issue) => issue.severity === "warn")
    expect(warningIssues).toHaveLength(0)

    const errorIssues = issues.filter((issue) => issue.severity === "error")
    expect(errorIssues).toHaveLength(1)
    expect(errorIssues[0]).toMatchObject({
      severity: "error",
      message: expect.stringContaining("Conflicting export"),
    })
  })

  it("should handle lowercase HTTP method names", async () => {
    const { routes } = await scanSourceDirectory(fixtureDir)

    const lowercaseRoute = routes.get("/lowercase")
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

    const { routes, issues } = await scanSourceDirectory(
      multipleMethodsFixtureDir,
    )

    expect(routes.size).toBe(0)

    // Should have zero warning issues
    const warningIssues = issues.filter((issue) => issue.severity === "warn")
    expect(warningIssues).toHaveLength(0)

    const errorIssues = issues.filter((issue) => issue.severity === "error")
    expect(errorIssues.length).toBeGreaterThanOrEqual(1)
    expect(
      errorIssues.some((issue) => issue.message.includes("Multiple exports")),
    ).toBe(true)
  })

  it("should handle index files mapping to parent directory route", async () => {
    const { routes } = await scanSourceDirectory(fixtureDir)

    const usersIndexRoute = routes.get("/users")
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
    const { routes } = await scanSourceDirectory(fixtureDir)

    const profileRoute = routes.get("/users/profile")
    expect(profileRoute).toMatchObject({
      sourcePath: "users/profile.js",
      routePath: "/users/profile",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })
  })

  it("should report multiple conflicting export errors in a single file", async () => {
    const multiConflictFixtureDir = path.join(
      __dirname,
      "fixtures",
      "multiple-methods",
    )

    const { routes, issues } = await scanSourceDirectory(
      multiConflictFixtureDir,
    )

    // Should have no routes due to errors
    expect(routes.size).toBe(0)

    // Should have multiple error issues - one for GET/get conflict and one for PUT/put conflict
    const errorIssues = issues.filter((issue) => issue.severity === "error")
    expect(errorIssues.length).toBeGreaterThanOrEqual(2)

    // Should have zero warning issues
    const warningIssues = issues.filter((issue) => issue.severity === "warn")
    expect(warningIssues).toHaveLength(0)

    // Check that we have errors for both method conflicts
    const messages = errorIssues.map((issue) => issue.message)
    expect(
      messages.some((msg) => msg.includes("GET") && msg.includes("get")),
    ).toBe(true)
    expect(
      messages.some((msg) => msg.includes("PUT") && msg.includes("put")),
    ).toBe(true)
  })

  it.todo("skips files with an unrecognized extension, but warns about them")

  it.todo("errors out if an export is not a function")

  it("warns about exports with non-standard names", async () => {
    const { routes, issues } = await scanSourceDirectory(fixtureDir)

    // Should still create route for the valid HTTP method
    const nonStandardRoute = routes.get("/non-standard-exports")
    expect(nonStandardRoute).toMatchObject({
      sourcePath: "non-standard-exports.js",
      routePath: "/non-standard-exports",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })

    const warningMessages = issues
      .filter(
        (issue) =>
          issue.severity === "warn" &&
          issue.filePath.includes("non-standard-exports.js"),
      )
      .map((issue) => issue.message)

    expect(warningMessages.length).toEqual(3)
    expect(warningMessages).toSatisfyAll(
      (message) =>
        message.includes("someHelper") ||
        message.includes("config") ||
        message.includes("INVALID_METHOD"),
    )
  })

  it("warns about modules with no exports", async () => {
    const { routes, issues } = await scanSourceDirectory(fixtureDir)

    // Should not create a route for the file with no exports
    expect(routes.has("/no-exports")).toBe(false)

    // Should warn about files with no exports
    const noExportsIssues = issues.filter((issue) =>
      issue.filePath.includes("no-exports.js"),
    )
    expect(noExportsIssues).toHaveLength(1)
    expect(noExportsIssues[0]).toMatchObject({
      severity: "warn",
      message:
        "Module has no exports - only HTTP method functions are used as handlers",
    })
  })

  it("should handle commonJS modules with named and default exports", async () => {
    const commonjsFixtureDir = path.join(__dirname, "fixtures", "commonjs")

    const { routes } = await scanSourceDirectory(commonjsFixtureDir)

    expect([...routes.keys()]).toIncludeSameMembers([
      "/cjs-named",
      "/cjs-default",
      "/cjs-mixed",
    ])

    // CommonJS named exports
    const cjsNamedRoute = routes.get("/cjs-named")
    expect(cjsNamedRoute).toMatchObject({
      sourcePath: "cjs-named.js",
      routePath: "/cjs-named",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
        POST: expect.toBeFunction(),
      }),
    })

    // CommonJS default export (should map to GET)
    const cjsDefaultRoute = routes.get("/cjs-default")
    expect(cjsDefaultRoute).toMatchObject({
      sourcePath: "cjs-default.js",
      routePath: "/cjs-default",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })

    // Mixed CommonJS and ES6 exports in TypeScript
    const cjsMixedRoute = routes.get("/cjs-mixed")
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
