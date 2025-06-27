"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanSourceDirectory = scanSourceDirectory;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const jiti_1 = require("jiti");
function scanSourceDirectory(sourceDir) {
    const routeMap = new Map();
    if (!node_fs_1.default.existsSync(sourceDir)) {
        console.warn(`Source directory does not exist: ${sourceDir}`);
        return routeMap;
    }
    scanDirectory(sourceDir, sourceDir, routeMap);
    return routeMap;
}
function scanDirectory(baseDir, currentDir, routeMap) {
    const entries = node_fs_1.default.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = node_path_1.default.join(currentDir, entry.name);
        if (entry.isDirectory()) {
            // Recursively scan subdirectories
            scanDirectory(baseDir, fullPath, routeMap);
        }
        else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".js") || entry.name.endsWith(".jsx"))) {
            // Process TypeScript/TSX/JavaScript/JSX files
            const routeInfo = createRouteInfo(baseDir, fullPath);
            if (routeInfo) {
                routeMap.set(routeInfo.routePath, routeInfo);
            }
        }
    }
}
function createRouteInfo(baseDir, filePath) {
    // Convert file path to route path
    const relativePath = node_path_1.default.relative(baseDir, filePath);
    const routePath = filePathToRoutePath(relativePath);
    // Extract HTTP methods from file
    const methods = extractMethodsFromFile(filePath);
    if (methods.length === 0) {
        return null; // Skip files with no HTTP method exports
    }
    return {
        filePath,
        routePath,
        methods,
    };
}
function filePathToRoutePath(relativePath) {
    // Remove file extension
    const withoutExt = relativePath.replace(/\.(ts|tsx|js|jsx)$/, "");
    // Convert to route path
    let routePath = "/" + withoutExt.replace(/\\/g, "/"); // Handle Windows paths
    // Convert index files to root paths
    routePath = routePath.replace(/\/index$/, "") || "/";
    return routePath;
}
function extractMethodsFromFile(filePath) {
    try {
        // Use jiti for runtime TypeScript transpilation
        const jiti = (0, jiti_1.createJiti)(__filename);
        const module = jiti(filePath);
        const methods = [];
        // Check for default export (treat as GET)
        if (module.default) {
            methods.push("GET");
        }
        return methods;
    }
    catch (error) {
        console.warn(`Failed to require file ${filePath}:`, error);
        return [];
    }
}
