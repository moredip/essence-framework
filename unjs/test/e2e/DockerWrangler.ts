import { spawn, ChildProcess } from 'node:child_process';

export class DockerWrangler {
  private containerProcess?: ChildProcess;
  private imageName: string;

  constructor(imageName: string) {
    this.imageName = imageName;
  }

  async buildImage(dockerfilePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const buildProcess = spawn('docker', ['build', '--no-cache', '-t', this.imageName, '.'], { 
        stdio: 'pipe',
        cwd: dockerfilePath
      });
      buildProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Docker build failed with code ${code}`));
      });
    });
  }

  async startContainer(port: number, volumeMount?: string): Promise<void> {
    const args = ['run', '--rm', '-p', `${port}:${port}`];
    
    if (volumeMount) {
      args.push('-v', volumeMount);
    }
    
    args.push(this.imageName);

    this.containerProcess = spawn('docker', args, { stdio: 'pipe' });
    
    // Wait for container to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  async stopContainer(): Promise<void> {
    if (this.containerProcess) {
      this.containerProcess.kill();
      // Wait for process to actually exit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Force stop any containers using the specified port
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
  }
}