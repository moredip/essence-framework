import path from "node:path"
import http from "node:http"
import { DockerWrangler } from "./DockerWrangler"

describe("Essence JSX Integration", () => {
  let docker: DockerWrangler

  // Helper function to make HTTP requests
  const makeRequest = async (
    path: string,
  ): Promise<{ data: string; headers: http.IncomingHttpHeaders; statusCode: number }> => {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:3000${path}`, (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () =>
          resolve({ data, headers: res.headers, statusCode: res.statusCode || 0 }),
        )
        res.on("error", reject)
      })
    })
  }

  beforeAll(async () => {
    docker = new DockerWrangler("essence-test")
    await docker.buildImage(path.join(__dirname, "../.."))
    await docker.startContainer(
      3000,
      `${path.join(__dirname, "fixtures/basic-app")}:/test-app`,
      "/test-app",
    )
  }, 30000)

  afterAll(async () => {
    if (docker) {
      await docker.stopContainer()
    }
  }, 15000)

  test("should transpile TSX and return HTML", async () => {
    const response = await makeRequest("/hello")

    expect(response.statusCode).toBe(200)
    expect(response.data).toEqual("Hello, world")
    expect(response.headers["content-type"]).toMatch(/text\/html/)
  })

  test("should transpile TypeScript with type annotations", async () => {
    const response = await makeRequest("/typed")

    expect(response.statusCode).toBe(200)
    expect(response.data).toEqual("Hello from TypeScript, age 15")
    expect(response.headers["content-type"]).toMatch(/text\/html/)
  })
})
