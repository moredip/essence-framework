import express from "express";
import { AddressInfo } from "net";
import logger from "./logger";
import { createRouter, RegisterPathActionsFn } from "./router";

export type EssenceServer = {
  startServer: () => void;
  registerPathActions: RegisterPathActionsFn;
  getBoundPort: () => number | null;
};

export async function createServer(port = 3553): Promise<EssenceServer> {
  const app = express();
  const router = createRouter(app);

  let boundPort: number | null = null;
  async function startServer() {
    return new Promise<void>((resolve, reject) => {
      const listener = app.listen(port, () => {
        // boundPort could be different than port if port === 0
        boundPort = (listener.address() as AddressInfo).port;
        logger.info(`Essence started on port ${boundPort}`);
        resolve();
      });
    });
  }

  return {
    startServer,
    registerPathActions: router.registerPathActions,
    getBoundPort: () => boundPort,
  };
}
