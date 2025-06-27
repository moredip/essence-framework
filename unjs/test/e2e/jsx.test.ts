import path from "node:path"
import http from "node:http"
import { DockerWrangler } from "./DockerWrangler"

describe("Essence JSX Integration", () => {
  let docker: DockerWrangler

  // Helper function to make HTTP requests
  const makeRequest = async (path: string): Promise<{ data: string; headers: http.IncomingHttpHeaders; statusCode: number }> => {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:3000${path}`, (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => resolve({ data, headers: res.headers, statusCode: res.statusCode || 0 }))
        res.on("error", reject)
      })
    })
  }

  beforeAll(async () => {
    // Build image once for all tests
    docker = new DockerWrangler("essence-test")
    await docker.buildImage(path.join(__dirname, "../.."))
  }, 30000)

  beforeEach(async () => {
    // Start fresh container for each test
    await docker.startContainer(3000, `${path.join(__dirname, "fixtures/basic-app")}:/test-app`, "/test-app")
  }, 15000)

  afterEach(async () => {
    // Clean up container after each test
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

  test("should handle multiple requests to same endpoint", async () => {
    const response1 = await makeRequest("/hello")
    const response2 = await makeRequest("/hello")

    expect(response1.statusCode).toBe(200)
    expect(response1.data).toEqual("Hello, world")
    expect(response2.statusCode).toBe(200)
    expect(response2.data).toEqual("Hello, world")
  })
})
