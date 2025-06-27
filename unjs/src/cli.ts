import { createApp, createRouter, toNodeListener } from 'h3';
import { createServer } from 'node:http';
import path from 'node:path';
import { createJiti } from 'jiti';
import { scanSourceDirectory } from './scanner';

// Get source directory from command line args
const sourceDir = process.argv[2] || './src';
const absoluteSourceDir = path.resolve(sourceDir);

console.log(`Scanning source directory: ${absoluteSourceDir}`);

// Scan for route files
const routeMap = scanSourceDirectory(absoluteSourceDir);

console.log('Route map:');
for (const [routePath, routeInfo] of routeMap) {
  console.log(`  ${routePath} -> ${routeInfo.filePath} [${routeInfo.methods.join(', ')}]`);
}

// Create h3 app and router
const app = createApp();
const router = createRouter();

// Register routes from route map
for (const [routePath, routeInfo] of routeMap) {
  if (routeInfo.methods.includes('GET')) {
    router.get(routePath, async (event) => {
      try {
        // Use jiti for runtime TypeScript transpilation
        const jiti = createJiti(__filename);
        const module = jiti(routeInfo.filePath);
        const handler = module.default || module.GET;
        
        if (typeof handler === 'function') {
          const result = await handler();
          return result;
        }
        
        return 'Handler not found';
      } catch (error) {
        console.error(`Error handling ${routePath}:`, error);
        return 'Internal server error';
      }
    });
  }
}

app.use(router);

const server = createServer(toNodeListener(app));

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});