import express from "express";
import logger from "./logger";
import { createRouter } from "./router";

export async function createServer(port = 3553) {
  const app = express();
  const router = createRouter(app);

  async function startServer() {
    app.listen(port, () => {
      logger.info(`Essence started on port ${port}`);
    });
  }

  return {
    startServer,
    registerPathActions: router.registerPathActions,
  };
}
