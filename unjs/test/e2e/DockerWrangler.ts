import { exec } from "node:child_process"
import { promisify } from "node:util"
import http from "node:http"
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
    port: number,
    localSourcePath?: string,
  ): Promise<void> {
    const args = ["run", "-d", "--init", "-p", `${port}:${port}`]
    const containerSourcePath = "/test-app"

    if (localSourcePath) {
      args.push("-v", `${localSourcePath}:${containerSourcePath}`)
    }

    args.push(this.imageName, containerSourcePath)

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

    await this.waitForContainerReady(port)
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

  private async waitForContainerReady(
    port: number,
    maxAttempts = 30,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const req = http.get(`http://localhost:${port}`, (_res) => {
            // Any response (including 404, 500, etc.) means the server is up
            resolve()
          })

          req.on("error", (err) => {
            reject(err)
          })

          req.setTimeout(1000, () => {
            req.destroy()
            reject(new Error("Request timeout"))
          })
        })

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
