import * as path from "path";
import { Router, Express } from "express";
import { PathActions } from "./types";
import { wrapActionHandler } from "./actionAdapter";
import logger from "./logger";

export type RegisterPathActionsFn = (
  pathActions: PathActions,
  routePath: string
) => void;

export function createRouter(expressApp: Express): {
  registerPathActions: RegisterPathActionsFn;
} {
  const expressRouter = Router();
  expressApp.use("/", expressRouter);

  function registerPathActions(pathActions: PathActions, routePath: string) {
    if (pathActions.get) {
      logger.debug(`registering GET ${routePath}`);
      expressRouter.get(routePath, wrapActionHandler(pathActions.get));
    }

    if (pathActions.post) {
      logger.debug(`registering POST ${routePath}`);
      expressRouter.post(routePath, wrapActionHandler(pathActions.post));
    }
  }

  return {
    registerPathActions,
  };
}
