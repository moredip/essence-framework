import path from "node:path"
import { scanSourceDirectory } from "../../src/endpointScanner"

describe("endpointScanner integration", () => {
  it("should scan a simple directory with one JS file", async () => {
    const fixtureDir = path.join(__dirname, "fixtures", "simple")

    const routeMap = await scanSourceDirectory(fixtureDir)

    expect(routeMap.size).toBe(1)

    const helloRoute = routeMap.get("/hello")
    expect(helloRoute).toMatchObject({
      sourcePath: "hello.js",
      routePath: "/hello",
      handlers: expect.objectContaining({
        GET: expect.toBeFunction(),
      }),
    })

    // Test that the function returns the expected result
    const result = helloRoute?.handlers.GET?.()
    expect(result).toEqual({ message: "Hello, world!" })
  })
})
