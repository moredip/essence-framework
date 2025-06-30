import path from "node:path"
import { DockerWrangler } from "./DockerWrangler"

describe("isolated end-to-end tests", () => {
  let docker: DockerWrangler

  beforeAll(async () => {
    docker = new DockerWrangler()
    await docker.buildImage()
    await docker.startContainer({ localSourcePath: path.join(__dirname, "fixtures/basic-app") })
  }, 30000)

  afterAll(async () => {
    if (docker) {
      await docker.stopContainer()
    }
  }, 15000)

  test("should return basic hello, world text", async () => {
    const response = await docker.makeRequestToPath("/hello")

    expect(response.status).toBe(200)
    expect(await response.text()).toEqual("Hello, world")
    expect(response.headers.get("content-type")).toEqual("text/plain")
  })

  test("should transpile TypeScript", async () => {
    const response = await docker.makeRequestToPath("/typed")

    expect(response.status).toBe(200)
    expect(await response.text()).toEqual("Hello from TypeScript, age 15")
  })

  test("should transpile JSX", async () => {
    const response = await docker.makeRequestToPath("/tsx-page")

    expect(response.status).toBe(200)
    expect(await response.text()).toEqual("<h1>Hello from JSX</h1>")
    expect(response.headers.get("content-type")).toEqual("text/html")
  })
})
