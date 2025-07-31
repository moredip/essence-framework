import path from "node:path"
import fs from "node:fs/promises"
import os from "node:os"
import { DockerWrangler } from "./DockerWrangler.js"

describe("file watching functionality", () => {
  let docker: DockerWrangler
  let testFixturePath: string

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))
  const sleepToAllowHotReload = () => sleep(500)

  beforeAll(async () => {
    // Create temporary directory for test fixtures
    testFixturePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "essence-file-watch-test-"),
    )

    // Create initial test files
    await fs.writeFile(
      path.join(testFixturePath, "dynamic.js"),
      `export const GET = () => {
  return "Initial content"
}`,
    )

    await fs.writeFile(
      path.join(testFixturePath, "static.js"),
      `export const GET = () => {
  return "This won't change"
}`,
    )

    docker = new DockerWrangler("essence-file-watch-test")
    await docker.buildImage()
    await docker.startContainer({
      localSourcePath: testFixturePath,
      devMode: true,
    })
  }, 45000)

  afterAll(async () => {
    if (docker) {
      await docker.stopContainer()
    }
  }, 15000)

  test("should reflect file changes via hot reload", async () => {
    // Make initial request
    const initialResponse = await docker.makeRequestToPath("/dynamic")
    expect(await initialResponse.text()).toEqual("Initial content")

    // Modify the file
    await fs.writeFile(
      path.join(testFixturePath, "dynamic.js"),
      `export const GET = () => {
  return "Updated content after hot reload"
}`,
    )

    await sleepToAllowHotReload()

    // Make request to see if changes are reflected
    const updatedResponse = await docker.makeRequestToPath("/dynamic")
    expect(updatedResponse.status).toBe(200)
    expect(await updatedResponse.text()).toEqual(
      "Updated content after hot reload",
    )
  }, 10000)

  test("should handle file additions via hot reload", async () => {
    // Create a new file
    await fs.writeFile(
      path.join(testFixturePath, "new-endpoint.js"),
      `export const GET = () => {
  return "New endpoint added dynamically"
}`,
    )

    await sleepToAllowHotReload()

    // Make request to the new endpoint
    const response = await docker.makeRequestToPath("/new-endpoint")
    expect(response.status).toBe(200)
    expect(await response.text()).toEqual("New endpoint added dynamically")
  }, 10000)

  test("should handle file deletions via hot reload", async () => {
    // First verify the endpoint exists
    const initialResponse = await docker.makeRequestToPath("/new-endpoint")
    expect(initialResponse.status).toBe(200)

    // Delete the file
    await fs.unlink(path.join(testFixturePath, "new-endpoint.js"))

    await sleepToAllowHotReload()

    // Make request to the deleted endpoint (should 404)
    const response = await docker.makeRequestToPath("/new-endpoint")
    expect(response.status).toBe(404)
  }, 10000)

  test("should not affect other endpoints during hot reload", async () => {
    // Verify static endpoint still works
    const staticResponse = await docker.makeRequestToPath("/static")
    expect(staticResponse.status).toBe(200)
    expect(await staticResponse.text()).toEqual("This won't change")

    // Verify dynamic endpoint still works with previous changes
    const dynamicResponse = await docker.makeRequestToPath("/dynamic")
    expect(dynamicResponse.status).toBe(200)
    expect(await dynamicResponse.text()).toEqual(
      "Updated content after hot reload",
    )
  })
})
