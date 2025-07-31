import path from "node:path"
import { fileURLToPath } from "node:url"
import { toPlainHandler } from "h3"
import { createAppFromSourceDirectory } from "../../src/server.js"
import "jest-extended"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe("endpoint integration tests", () => {
  const fixtureDir = path.join(__dirname, "fixtures", "simple")

  it("can access query parameters via context", async () => {
    const app = await createAppFromSourceDirectory(
      fixtureDir,
      false,
      "http://localhost:3000",
    )
    const plainHandler = toPlainHandler(app)

    const request = {
      method: "GET",
      path: "/query-params?name=Alice&age=25",
      headers: {},
    }

    const response = await plainHandler(request)

    const responseBody = JSON.parse(response.body as string)
    expect(responseBody).toEqual({
      name: "Alice",
      age: "25",
      allParams: { name: "Alice", age: "25" },
    })
  })

  it("can handle array query parameters (tags=a&tags=b&tags=c)", async () => {
    const app = await createAppFromSourceDirectory(
      fixtureDir,
      false,
      "http://localhost:3000",
    )
    const plainHandler = toPlainHandler(app)

    const request = {
      method: "GET",
      path: "/query-params?tags=javascript&tags=web&tags=dev&name=test",
      headers: {},
    }

    const response = await plainHandler(request)

    const responseBody = JSON.parse(response.body as string)
    expect(responseBody["allParams"]).toEqual({
      tags: ["javascript", "web", "dev"],
      name: "test",
    })
  })
})
