import * as path from "path";
import { autoDiscover } from "./autoDiscovery";
import logger from "./logger";
import { createServer } from "./server";

export default async function essence(targetPath: string, port?: number) {
  logger.debug(`booting server for ${targetPath}...`);

  if (!port && process.env["PORT"]) {
    port = parseInt(process.env["PORT"]);
  }

  const essenceServer = await createServer(port);

  await autoDiscover(targetPath, essenceServer.registerPathActions);

  return essenceServer;
}
