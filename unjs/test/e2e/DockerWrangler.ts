import { spawn } from "node:child_process"
import http from "node:http"

export class DockerWrangler {
  private containerId?: string
  private imageName: string

  constructor(imageName: string) {
    this.imageName = imageName
  }

  async buildImage(dockerfilePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const buildProcess = spawn(
        "docker",
        ["build", "--no-cache", "-t", this.imageName, "-f", "test/e2e/Dockerfile", "."],
        {
          stdio: "pipe",
          cwd: dockerfilePath,
        },
      )
      buildProcess.on("close", (code) => {
        if (code === 0) {
          resolve()
        } else {
          console.error(`❌ Docker build failed with code ${code}`)
          reject(new Error(`Docker build failed with code ${code}`))
        }
      })
    })
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

    // Run container in detached mode and capture container ID
    const containerProcess = spawn("docker", args, { stdio: "pipe" })

    let containerIdOutput = ""
    containerProcess.stdout?.on("data", (data) => {
      containerIdOutput += data.toString()
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
