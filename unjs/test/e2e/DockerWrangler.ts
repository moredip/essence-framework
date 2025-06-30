import { exec } from "node:child_process"
import { promisify } from "node:util"
import path from "node:path"

const execAsync = promisify(exec)
const PROJECT_ROOT = path.join(__dirname, "../..")
const DOCKERFILE_PATH = path.relative(
  PROJECT_ROOT,
  path.join(__dirname, "Dockerfile"),
)

export class DockerWrangler {
  private containerId?: string
  private imageName: string
  private assignedPort?: number

  constructor(imageName: string = "essence-e2e-test-image") {
    this.imageName = imageName
  }

  async buildImage(): Promise<void> {
    const command = `docker build --no-cache -t ${this.imageName} -f ${DOCKERFILE_PATH} .`
    console.log(`Building Docker image: ${command}`)

    try {
      await execAsync(command, { cwd: PROJECT_ROOT })
    } catch (error: any) {
      console.error(`❌ Docker build failed:`)
      if (error.stdout) {
        console.error("Build stdout:", error.stdout)
      }
      if (error.stderr) {
        console.error("Build stderr:", error.stderr)
      }
      console.error("Error details:", error.message || error)
      throw error
    }
  }

  async startContainer(
    options: { localSourcePath?: string; additionalArgs?: string[] } = {},
  ): Promise<void> {
    const { localSourcePath, additionalArgs = [] } = options
    const args = ["run", "-d", "--init", "-P"] // Publish all exposed ports to random host ports
    const containerSourcePath = "/test-app"

    if (localSourcePath) {
      args.push("-v", `${localSourcePath}:${containerSourcePath}`)
    }

    args.push(this.imageName, containerSourcePath, ...additionalArgs)

    const command = `docker ${args.join(" ")}`
    console.log("Docker run command:", command)

    try {
      const { stdout } = await execAsync(command)
      this.containerId = stdout.trim()
      console.log(
        `🐳 Container started. To view logs: docker logs ${this.containerId}`,
      )
    } catch (error: any) {
      console.error(`❌ Docker run failed:`)
      if (error.stdout) {
        console.error("Container stdout:", error.stdout)
      }
      if (error.stderr) {
        console.error("Container stderr:", error.stderr)
      }
      console.error("Error details:", error.message || error)
      throw error
    }

    // Get the assigned port
    await this.getAssignedPort()
    await this.waitForContainerReady()
  }

  async stopContainer(): Promise<void> {
    if (!this.containerId) {
      throw new Error("No container is currently running")
    }

    const command = `docker stop ${this.containerId}`
    console.log("Docker stop command:", command)

    try {
      await execAsync(command)
      console.log("🛑 Container stopped successfully")
    } catch (error: any) {
      console.error(`❌ Docker stop failed:`)
      if (error.stdout) {
        console.error("Stop stdout:", error.stdout)
      }
      if (error.stderr) {
        console.error("Stop stderr:", error.stderr)
      }
      console.error("Error details:", error.message || error)
      throw error
    }

    this.containerId = undefined
  }

  private async getAssignedPort(): Promise<void> {
    if (!this.containerId) {
      throw new Error("No container is running")
    }

    const command = `docker port ${this.containerId} 3000`
    try {
      const { stdout } = await execAsync(command)
      const portMapping = stdout.trim() // Format: "0.0.0.0:32768"
      const port = parseInt(portMapping.split(":")[1])
      this.assignedPort = port
      console.log(`📡 Container port 3000 is mapped to host port ${port}`)
    } catch (error: any) {
      console.error(`❌ Failed to get assigned port:`)
      if (error.stderr) {
        console.error("Port stderr:", error.stderr)
      }
      throw error
    }
  }

  async makeRequestToPath(path: string): Promise<Response> {
    if (!this.assignedPort) {
      throw new Error("Container not started or port not assigned")
    }

    const url = `http://localhost:${this.assignedPort}${path}`
    return await fetch(url)
  }

  private async waitForContainerReady(maxAttempts = 30): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.makeRequestToPath("/")
        // Success - container is ready
        return
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(
            `Container failed to start after ${maxAttempts} attempts`,
          )
        }

        // Wait 1 second before next attempt
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }
}
