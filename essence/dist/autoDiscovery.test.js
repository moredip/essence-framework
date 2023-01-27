var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/lib/autoDiscovery.ts
var path = __toESM(require("path"));
var walk = __toESM(require("walkdir"));

// src/lib/logger.ts
var import_pino = __toESM(require("pino"));
var logger = (0, import_pino.default)({ level: "debug" });

// src/lib/autoDiscovery.ts
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

// src/lib/autoDiscovery.test.ts
describe("autoDiscovery", () => {
  describe("routePath", () => {
    const routePath = routePathWithBase("/base");
    test("/index.ts", () => {
      const result = routePath("/base/index.ts");
      expect(result).toBe("/");
    });
    test("/blah.ts", () => {
      const result = routePath("/base/blah.ts");
      expect(result).toBe("/blah");
    });
    test("/foo/bar/index.ts", () => {
      const result = routePath("/base/foo/bar/index.ts");
      expect(result).toBe("/foo/bar");
    });
    test("/foo/bar/blah.ts", () => {
      const result = routePath("/base/foo/bar/blah.ts");
      expect(result).toBe("/foo/bar/blah");
    });
    test("/foo/bar/:userId.ts", () => {
      const result = routePath("/base/foo/bar/:userId.ts");
      expect(result).toBe("/foo/bar/:userId");
    });
    test("/foo/bar/:userId/index.ts", () => {
      const result = routePath("/base/foo/bar/:userId/index.ts");
      expect(result).toBe("/foo/bar/:userId");
    });
  });
});
