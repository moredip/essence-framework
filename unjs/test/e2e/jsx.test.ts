import { spawn, ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

describe('Essence JSX Integration', () => {
  let server: ChildProcess;
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

    // Start server using local built CLI
    server = spawn('node', ['./dist/cli.js', testDir], { stdio: 'pipe' });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(() => {
    if (server) {
      server.kill();
    }
    // Cleanup test fixture
    fs.rmSync(testDir, { recursive: true, force: true });
  });

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