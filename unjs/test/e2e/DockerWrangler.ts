import { spawn, exec } from "node:child_process"
import { promisify } from "node:util"
import http from "node:http"
import path from "node:path"

const execAsync = promisify(exec)
const PROJECT_ROOT = path.join(__dirname, "../..")
const DOCKERFILE_PATH = path.relative(PROJECT_ROOT, path.join(__dirname, "Dockerfile"))

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
    volumeMount?: string,
    sourceDir = "/test-app",
  ): Promise<void> {
    const args = ["run", "-d", "--init", "-p", `${port}:${port}`]

    if (volumeMount) {
      args.push("-v", volumeMount)
    }

    args.push(this.imageName, sourceDir)

    console.log("Docker run command:", ["docker", ...args].join(" "))

    // Run container in detached mode and capture container ID
    const containerProcess = spawn("docker", args, { stdio: "pipe" })

    let containerIdOutput = ""
    let containerStderr = ""
    
    containerProcess.stdout?.on("data", (data) => {
      containerIdOutput += data.toString()
    })

    containerProcess.stderr?.on("data", (data) => {
      containerStderr += data.toString()
    })

    await new Promise<void>((resolve, reject) => {
      containerProcess.on("close", (code) => {
        if (code === 0) {
          this.containerId = containerIdOutput.trim()
          console.log(
            `🐳 Container started. To view logs: docker logs ${this.containerId}`,
          )
          resolve()
        } else {
          console.error(`❌ Docker run failed with code ${code}`)
          console.error("Container stderr:", containerStderr)
          console.error("Container stdout:", containerIdOutput)
          reject(new Error(`Docker run failed with code ${code}`))
        }
      })
    })

    await this.waitForContainerReady(port)
  }

  async stopContainer(): Promise<void> {
    if (!this.containerId) {
      throw new Error("No container is currently running")
    }

    // Stop the container gracefully
    await new Promise<void>((resolve, reject) => {
      const stopProcess = spawn("docker", ["stop", this.containerId!], {
        stdio: "pipe",
      })
      stopProcess.on("close", (code) => {
        if (code === 0) {
          resolve()
        } else {
          console.error(`❌ Docker stop failed with code ${code}`)
          reject(new Error(`Docker stop failed with code ${code}`))
        }
      })
    })

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
