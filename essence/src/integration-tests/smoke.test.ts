import axios, { AxiosInstance } from "axios"
import path from "path"

import essence from "../lib/entryPoint"
import { EssenceServer } from "../lib/server"

describe("[INTEGRATION] smoke tests", () => {
  let server: EssenceServer | null = null
  let client: AxiosInstance | null = null

  beforeAll(async () => {
    const serverFixtureDir = path.resolve(__dirname, "server")
    server = await essence(serverFixtureDir, 0)
    await server.startServer()
    const baseURL = `http://localhost:${server.getBoundPort()}`
    console.log(baseURL)
    client = axios.create({ baseURL })
  })

  afterAll(async () => {
    if (server !== null) {
      await server.stopServer()
    }
  })

  describe("/", () => {
    it("returns the correct response", async () => {
      const result = await client!.get<string>("/")
      expect(result.status).toBe(200)
      expect(result.data).toBe("hello from /")
    })
  })
  describe("/foo", () => {
    it("returns the correct response", async () => {
      const result = await client!.get<string>("/foo")
      expect(result.status).toBe(200)
      expect(result.data).toBe("hello from /foo.ts")
    })
  })

  describe("/bar", () => {
    it("returns the correct response", async () => {
      const result = await client!.get<string>("/bar")
      expect(result.status).toBe(200)
      expect(result.data).toBe("hello from /bar/index.ts")
    })
  })

  describe("/bar/baz", () => {
    it("returns the correct response", async () => {
      const result = await client!.get<string>("/bar/baz")
      expect(result.status).toBe(200)
      expect(result.data).toBe("hello from /bar/baz.ts")
    })
  })

  describe("/bar/chirp.js", () => {
    it("returns the correct response", async () => {
      const result = await client!.get<string>("/bar/chirp")
      expect(result.status).toBe(200)
      expect(result.data).toBe("hello from /bar/chirp.js")
    })
  })

  describe("unrecognized path", () => {
    it("returns a 404", async () => {
      const result = await client!.get<string>("/invalid/path", { validateStatus: () => true })
      expect(result.status).toBe(404)
    })
  })
})
