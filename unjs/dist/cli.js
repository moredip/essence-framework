"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const h3_1 = require("h3");
const node_http_1 = require("node:http");
const node_path_1 = __importDefault(require("node:path"));
const scanner_1 = require("./scanner");
// Get source directory from command line args
const sourceDir = process.argv[2] || './src';
const absoluteSourceDir = node_path_1.default.resolve(sourceDir);
console.log(`Scanning source directory: ${absoluteSourceDir}`);
// Scan for route files
const routeMap = (0, scanner_1.scanSourceDirectory)(absoluteSourceDir);
console.log('Route map:');
for (const [routePath, routeInfo] of routeMap) {
    console.log(`  ${routePath} -> ${routeInfo.filePath} [${routeInfo.methods.join(', ')}]`);
}
// Create h3 app and router
const app = (0, h3_1.createApp)();
const router = (0, h3_1.createRouter)();
// Register routes from route map
for (const [routePath, routeInfo] of routeMap) {
    if (routeInfo.methods.includes('GET')) {
        router.get(routePath, async (event) => {
            try {
                const module = require(routeInfo.filePath);
                const handler = module.default || module.GET;
                if (typeof handler === 'function') {
                    const result = await handler();
                    return result;
                }
                return 'Handler not found';
            }
            catch (error) {
                console.error(`Error handling ${routePath}:`, error);
                return 'Internal server error';
            }
        });
    }
}
app.use(router);
const server = (0, node_http_1.createServer)((0, h3_1.toNodeListener)(app));
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
