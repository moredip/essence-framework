import path from "node:path"
import http from "node:http"
import { DockerWrangler } from "./DockerWrangler"

describe("Essence JSX Integration", () => {
  let docker: DockerWrangler

  beforeAll(async () => {
    docker = new DockerWrangler("essence-test")
    await docker.buildImage(path.join(__dirname, "../.."))
    await docker.startContainer(3000, `${path.join(__dirname, "fixtures/basic-app")}:/app/src`)
  }, 30000)

  afterAll(async () => {
    if (docker) {
      await docker.stopContainer()
    }
  }, 15000)

  test("should transpile TSX and return HTML", async () => {
    const response = await new Promise<{ data: string; headers: http.IncomingHttpHeaders }>(
      (resolve, reject) => {
        http.get("http://localhost:3000/hello", (res) => {
          let data = ""
          res.on("data", (chunk) => (data += chunk))
          res.on("end", () => resolve({ data, headers: res.headers }))
          res.on("error", reject)
        })
      },
    )

    expect(response.data).toContain("<h1>Hello from JSX!</h1>")
    expect(response.headers["content-type"]).toMatch(/text\/html/)
  })
})
