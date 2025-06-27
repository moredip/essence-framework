import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { DockerWrangler } from './DockerWrangler';

describe('Essence JSX Integration', () => {
  let docker: DockerWrangler;
  const testDir = path.join(__dirname, 'test-fixture');
  const srcDir = path.join(testDir, 'src');

  beforeAll(async () => {
    // Create test fixture
    fs.mkdirSync(srcDir, { recursive: true });
    
    // Write JSX handler
    fs.writeFileSync(path.join(srcDir, 'hello.tsx'), `
export const GET = () => {
  return <h1>Hello from JSX!</h1>;
};
`);

    // Set up Docker
    docker = new DockerWrangler('essence-test');
    await docker.buildImage(path.join(__dirname, '../..'));
    await docker.startContainer(3000, `${testDir}:/app/test-src`);
  }, 30000);

  afterAll(async () => {
    if (docker) {
      await docker.stopContainer();
    }
    
    // Cleanup test fixture
    fs.rmSync(testDir, { recursive: true, force: true });
  }, 15000);

  test('should transpile TSX and return HTML', async () => {
    const response = await new Promise<{ data: string; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      http.get('http://localhost:3000/hello', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ data, headers: res.headers }));
        res.on('error', reject);
      });
    });

    expect(response.data).toContain('<h1>Hello from JSX!</h1>');
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });
});