import path from "node:path"
import fs from "node:fs/promises"
import http from "node:http"
import { DockerWrangler } from "./DockerWrangler"

describe("file watching functionality", () => {
  let docker: DockerWrangler
  const testFixturePath = path.join(__dirname, "fixtures/file-watching-app")

  // Helper function to make HTTP requests
  const makeRequest = async (
    path: string,
  ): Promise<{
    data: string
    headers: http.IncomingHttpHeaders
    statusCode: number
  }> => {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:3000${path}`, (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () =>
          resolve({
            data,
            headers: res.headers,
            statusCode: res.statusCode || 0,
          }),
        )
        res.on("error", reject)
      })
    })
  }

  // Helper function to wait for a short period
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  beforeAll(async () => {
    // Create test fixture directory and files
    await fs.mkdir(testFixturePath, { recursive: true })
    
    // Create initial test files
    await fs.writeFile(
      path.join(testFixturePath, "dynamic.js"),
      `export const GET = () => {
  return "Initial content"
}`
    )

    await fs.writeFile(
      path.join(testFixturePath, "static.js"),
      `export const GET = () => {
  return "This won't change"
}`
    )

    docker = new DockerWrangler("essence-file-watch-test")
    await docker.buildImage(path.join(__dirname, "../.."))
    await docker.startContainer(
      3000,
      `${testFixturePath}:/test-app`,
      "/test-app",
      ["--watch"], // Force enable file watching
    )
  }, 45000)

  afterAll(async () => {
    if (docker) {
      await docker.stopContainer()
    }
    
    // Clean up test fixture directory
    try {
      await fs.rm(testFixturePath, { recursive: true, force: true })
    } catch (error) {
      console.warn("Failed to clean up test fixture:", error)
    }
  }, 15000)

  test("should serve initial content", async () => {
    const response = await makeRequest("/dynamic")
    
    expect(response.statusCode).toBe(200)
    expect(response.data).toEqual("Initial content")
  })

  test("should reflect file changes via hot reload", async () => {
    // Make initial request
    const initialResponse = await makeRequest("/dynamic")
    expect(initialResponse.data).toEqual("Initial content")

    // Modify the file
    await fs.writeFile(
      path.join(testFixturePath, "dynamic.js"),
      `export const GET = () => {
  return "Updated content after hot reload"
}`
    )

    // Wait for file watcher to detect changes and rebuild
    await wait(500)

    // Make request to see if changes are reflected
    const updatedResponse = await makeRequest("/dynamic")
    expect(updatedResponse.statusCode).toBe(200)
    expect(updatedResponse.data).toEqual("Updated content after hot reload")
  }, 10000)

  test("should handle file additions via hot reload", async () => {
    // Create a new file
    await fs.writeFile(
      path.join(testFixturePath, "new-endpoint.js"),
      `export const GET = () => {
  return "New endpoint added dynamically"
}`
    )

    // Wait for file watcher to detect changes and rebuild
    await wait(500)

    // Make request to the new endpoint
    const response = await makeRequest("/new-endpoint")
    expect(response.statusCode).toBe(200)
    expect(response.data).toEqual("New endpoint added dynamically")
  }, 10000)

  test("should handle file deletions via hot reload", async () => {
    // First verify the endpoint exists
    const initialResponse = await makeRequest("/new-endpoint")
    expect(initialResponse.statusCode).toBe(200)

    // Delete the file
    await fs.unlink(path.join(testFixturePath, "new-endpoint.js"))

    // Wait for file watcher to detect changes and rebuild
    await wait(500)

    // Make request to the deleted endpoint (should 404)
    const response = await makeRequest("/new-endpoint")
    expect(response.statusCode).toBe(404)
  }, 10000)

  test("should not affect other endpoints during hot reload", async () => {
    // Verify static endpoint still works
    const staticResponse = await makeRequest("/static")
    expect(staticResponse.statusCode).toBe(200)
    expect(staticResponse.data).toEqual("This won't change")

    // Verify dynamic endpoint still works with previous changes
    const dynamicResponse = await makeRequest("/dynamic")
    expect(dynamicResponse.statusCode).toBe(200)
    expect(dynamicResponse.data).toEqual("Updated content after hot reload")
  })
})