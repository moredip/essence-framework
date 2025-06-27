import path from "node:path"
import http from "node:http"
import { DockerWrangler } from "./DockerWrangler"

describe("Essence JSX Integration", () => {
  let docker: DockerWrangler

  beforeAll(async () => {
    docker = new DockerWrangler("essence-test")
    await docker.buildImage(path.join(__dirname, "../.."))
    await docker.startContainer(3000, `${path.join(__dirname, "fixtures/basic-app")}:/test-app`, "/test-app")
  }, 30000)

  afterAll(async () => {
    if (docker) {
      await docker.stopContainer()
    }
  }, 15000)

  test("should transpile TSX and return HTML", async () => {
    const response = await new Promise<{ data: string; headers: http.IncomingHttpHeaders; statusCode: number }>(
      (resolve, reject) => {
        http.get("http://localhost:3000/hello", (res) => {
          let data = ""
          res.on("data", (chunk) => (data += chunk))
          res.on("end", () => resolve({ data, headers: res.headers, statusCode: res.statusCode || 0 }))
          res.on("error", reject)
        })
      },
    )

    expect(response.statusCode).toBe(200)
    expect(response.data).toEqual("Hello, world")
    expect(response.headers["content-type"]).toMatch(/text\/html/)
  })
})
