import axios, { AxiosInstance } from "axios";
import path from "path";

import essence from "../lib/entryPoint";
import { EssenceServer } from "../lib/server";

describe("[INTEGRATION] smoke tests", () => {
  let server: EssenceServer | null = null;
  let client: AxiosInstance | null = null;

  beforeAll(async () => {
    const serverFixtureDir = path.resolve(__dirname, "server");
    server = await essence(serverFixtureDir, 0);
    await server.startServer();
    const baseURL = `http://localhost:${server.getBoundPort()}`;
    console.log(baseURL);
    client = axios.create({ baseURL });
  });

  afterAll(async () => {
    // TODO: shut down server!
  });

  describe("/", () => {
    it("returns the correct response", async () => {
      const result = await client!.get<string>("/");
      expect(result.status).toBe(200);
      expect(result.data).toBe("hello from /");
    });
  });
});
