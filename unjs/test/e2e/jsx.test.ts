import { spawn, ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

describe('Essence JSX Integration', () => {
  let containerProcess: ChildProcess;
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

    // Build Docker image
    await new Promise<void>((resolve, reject) => {
      const buildProcess = spawn('docker', ['build', '--no-cache', '-t', 'essence-test', '.'], { 
        stdio: 'pipe',
        cwd: path.join(__dirname, '../..')
      });
      buildProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Docker build failed with code ${code}`));
      });
    });

    // Start Docker container
    containerProcess = spawn('docker', [
      'run', '--rm', '-p', '3000:3000', 
      '-v', `${testDir}:/app/test-src`,
      'essence-test'
    ], { stdio: 'pipe' });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, 30000);

  afterAll(async () => {
    if (containerProcess) {
      containerProcess.kill();
      // Wait for process to actually exit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Force stop any containers using port 3000
    await new Promise<void>((resolve) => {
      const stopProcess = spawn('docker', ['ps', '--filter', 'publish=3000', '--format', '{{.ID}}'], { 
        stdio: 'pipe' 
      });
      let containerIds = '';
      stopProcess.stdout?.on('data', (data) => containerIds += data.toString());
      stopProcess.on('close', () => {
        if (containerIds.trim()) {
          const killProcess = spawn('docker', ['kill', ...containerIds.trim().split('\n')], { stdio: 'ignore' });
          killProcess.on('close', () => resolve());
        } else {
          resolve();
        }
      });
    });
    
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