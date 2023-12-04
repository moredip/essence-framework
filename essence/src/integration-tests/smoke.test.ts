import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"
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
      const result = await get200("/")
      expect(result.data).toBe("hello from /")
    })
  })
  describe("/foo", () => {
    it("returns the correct response", async () => {
      const result = await get200("/foo")
      expect(result.data).toBe("hello from /foo.ts")
    })
  })

  describe("/bar", () => {
    it("returns the correct response", async () => {
      const result = await get200("/bar")
      expect(result.data).toBe("hello from /bar/index.ts")
    })
  })

  describe("/bar/baz", () => {
    it("returns the correct response", async () => {
      const result = await get200("/bar/baz")
      expect(result.data).toBe("hello from /bar/baz.ts")
    })
  })

  describe("/bar/chirp.js", () => {
    it("returns the correct response", async () => {
      const result = await get200("/bar/chirp")
      expect(result.data).toBe("hello from /bar/chirp.js")
    })
  })

  describe("/sync.ts", () => {
    it("returns the correct response", async () => {
      const result = await get200("/sync")
      expect(result.data).toBe("hello from a non-async function")
    })
  })

  describe("unrecognized path", () => {
    it("returns a 404", async () => {
      const result = await get("/invalid/path")
      expect(result.status).toBe(404)
    })
  })

  describe("/json.ts", () => {
    it("returns pretty printed JSON with the correct content-type", async () => {
      const result = await get200("/json", { transformResponse: (x) => x })
      expect(result.headers["content-type"]).toMatch("application/json")
      expect(result.data).toBe(`{
  "some": {
    "nice json": [
      1,
      "two",
      3
    ]
  }
}`)
    })
  })

  describe("alternative HTTP methods", () => {
    it("supports POST", async () => {
      const result = await client!.post<string>("/methods")
      expect(result.status).toBe(200)
      expect(result.data).toBe("POST to /methods/index.ts")
    })

    it("supports PUT", async () => {
      const result = await client!.put<string>("/methods")
      expect(result.status).toBe(200)
      expect(result.data).toBe("PUT to /methods/index.ts")
    })

    it("supports PATCH", async () => {
      const result = await client!.patch<string>("/methods")
      expect(result.status).toBe(200)
      expect(result.data).toBe("PATCH to /methods/index.ts")
    })

    it("supports DELETE", async () => {
      const result = await client!.delete<string>("/methods")
      expect(result.status).toBe(200)
      expect(result.data).toBe("DELETE to /methods/index.ts")
    })

    it("supports OPTIONS", async () => {
      const result = await client!.options<string>("/methods")
      expect(result.status).toBe(200)
      expect(result.data).toBe("OPTIONS to /methods/index.ts")
    })
  })

  describe("support for static/hardcoded responses", () => {
    test("es6 exporting default string", async () => {
      const result = await get200("/statics/exports/es6_default_text")
      expect(result.data).toBe("es6 default export string")
    })
    test("cjs exporting default string", async () => {
      const result = await get200("/statics/exports/cjs_default_text")
      expect(result.data).toBe("cjs default export string")
    })

    test("named string exports", async () => {
      const post = await client!.post<string>("/statics/exports/named_text")
      expect(post.data).toBe("export POST")

      const del = await client!.delete<string>("/statics/exports/named_text")
      expect(del.data).toBe("export DELETE")
    })

    test("json from object exports", async () => {
      const post = await client!.get<string>("/statics/exports/json")
      expect(post.data).toEqual({ json: ["from", "get"] })

      const patch = await client!.patch<string>("/statics/exports/json")
      expect(patch.data).toEqual({ json: ["from", "patch"] })
    })

    test(".txt file", async () => {
      const result = await get200("/statics/files/text")
      expect(result.data).toEqual("a static text file\n")
    })
  })

  describe("params", () => {
    test("simple path params", async () => {
      const result = await get200("/path-params/single-trailing-param/this-is-the-param")
      expect(result.data).toEqual({ pathParams: { id: "this-is-the-param" } })
    })

    test("complex path params and query params", async () => {
      const result = await get200(
        "/path-params/multiple/number1/foo/the%202nd/bar?x=1&2=baz&x=2&blank",
      )
      expect(result.data).toEqual({
        pathParams: { first: "number1", "2": "the 2nd" },
        queryParams: { x: ["1", "2"], "2": "baz", blank: "" },
      })
    })
  })

  xdescribe("withExpressRoute", () => {
    it("returns responses from the appropriate express handler", async () => {
      const get = await get200("/express")
      expect(get.data).toEqual("from express")
    })
  })

  async function get200(
    path: string,
    axiosConfig: AxiosRequestConfig = {},
  ): Promise<AxiosResponse> {
    const result = await get(path, axiosConfig)
    expect(result.status).toEqual(200)
    return result
  }

  async function get(path: string, axiosConfig: AxiosRequestConfig = {}): Promise<AxiosResponse> {
    const result = await client!.get<string>(path, {
      validateStatus: () => true, // don't throw an error on 404
      ...axiosConfig,
    })
    return result
  }
})
