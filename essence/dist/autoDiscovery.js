var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/autoDiscovery.ts
var autoDiscovery_exports = {};
__export(autoDiscovery_exports, {
  autoDiscover: () => autoDiscover,
  routePathWithBase: () => routePathWithBase
});
module.exports = __toCommonJS(autoDiscovery_exports);
var path = __toESM(require("path"));
var walk = __toESM(require("walkdir"));

// src/lib/logger.ts
var import_pino = __toESM(require("pino"));
var logger = (0, import_pino.default)({ level: "debug" });
var logger_default = logger;

// src/lib/autoDiscovery.ts
async function autoDiscover(apiRootPath, registerPathActions) {
  logger_default.info("root for action handlers: " + apiRootPath);
  const routePath = routePathWithBase(apiRootPath);
  const handlerPaths = await walk.async(apiRootPath, { return_object: true });
  for (const [handlerPath, stats] of Object.entries(handlerPaths)) {
    if (!stats.isFile()) {
      continue;
    }
    logger_default.debug("handlerPath: " + handlerPath);
    const route = routePath(handlerPath);
    logger_default.debug("route: " + route);
    const importedActions = await import(handlerPath);
    const actions = normalizeActions(importedActions);
    registerPathActions(actions, route);
  }
}
function normalizeActions(importedActions) {
  if (typeof importedActions === "function") {
    return { get: importedActions, post: null };
  }
  const post = importedActions.post || null;
  const get = importedActions.get || importedActions.default || null;
  return { get, post };
}
function routePathWithBase(basePath) {
  return function routePath(actionHandlerPath) {
    const relative2 = path.relative(basePath, actionHandlerPath);
    if (!(relative2 && !relative2.startsWith("..") && !path.isAbsolute(relative2))) {
      throw new Error(
        `${actionHandlerPath} is not a subdirectory of ${basePath}`
      );
    }
    const parsed = path.parse(relative2);
    if (parsed.name === "index") {
      return "/" + parsed.dir;
    }
    const prefix = parsed.dir === "" ? "" : "/";
    return prefix + parsed.dir + "/" + parsed.name;
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  autoDiscover,
  routePathWithBase
});
