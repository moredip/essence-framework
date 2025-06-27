import { spawn } from "node:child_process"
import http from "node:http"

export class DockerWrangler {
  private containerId?: string
  private imageName: string

  constructor(imageName: string) {
    this.imageName = imageName
  }

  async buildImage(dockerfilePath: string): Promise<void> {
    console.log(`🔨 Building Docker image '${this.imageName}'...`)
    return new Promise<void>((resolve, reject) => {
      const buildProcess = spawn("docker", ["build", "--no-cache", "-t", this.imageName, "."], {
        stdio: "pipe",
        cwd: dockerfilePath,
      })
      buildProcess.on("close", (code) => {
        if (code === 0) {
          console.log(`✅ Docker image '${this.imageName}' built successfully`)
          resolve()
        } else {
          console.error(`❌ Docker build failed with code ${code}`)
          reject(new Error(`Docker build failed with code ${code}`))
        }
      })
    })
  }

  async startContainer(port: number, volumeMount?: string): Promise<void> {
    const args = ["run", "-d", "--init", "-p", `${port}:${port}`]

    if (volumeMount) {
      args.push("-v", volumeMount)
      console.log(`🚀 Starting container with volume: ${volumeMount}`)
    } else {
      console.log(`🚀 Starting container on port ${port}...`)
    }

    args.push(this.imageName)

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
          console.log(`📦 Container started with ID: ${this.containerId.substring(0, 12)}...`)
          resolve()
        } else {
          console.error(`❌ Docker run failed with code ${code}`)
          reject(new Error(`Docker run failed with code ${code}`))
        }
      })
    })

    // Wait for container to be ready by pinging the endpoint
    console.log(`⏳ Waiting for container to be ready on port ${port}...`)
    await this.waitForContainerReady(port)
    console.log(`✅ Container is ready and responding!`)
  }

  async stopContainer(): Promise<void> {
    if (!this.containerId) {
      console.log(`ℹ️ No container to stop`)
      return
    }

    console.log(`🛑 Stopping container ${this.containerId.substring(0, 12)}...`)

    // Stop the container gracefully
    await new Promise<void>((resolve, reject) => {
      const stopProcess = spawn("docker", ["stop", this.containerId!], { stdio: "pipe" })
      stopProcess.on("close", (code) => {
        if (code === 0) {
          console.log(`⏹️ Container stopped successfully`)
          resolve()
        } else {
          console.error(`❌ Docker stop failed with code ${code}`)
          reject(new Error(`Docker stop failed with code ${code}`))
        }
      })
    })

    // Remove the container
    console.log(`🗑️ Removing container...`)
    await new Promise<void>((resolve, reject) => {
      const rmProcess = spawn("docker", ["rm", this.containerId!], { stdio: "pipe" })
      rmProcess.on("close", (code) => {
        if (code === 0) {
          console.log(`✅ Container removed successfully`)
          resolve()
        } else {
          console.error(`❌ Docker rm failed with code ${code}`)
          reject(new Error(`Docker rm failed with code ${code}`))
        }
      })
    })

    this.containerId = undefined
  }

  private async waitForContainerReady(port: number, maxAttempts = 30): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const req = http.get(`http://localhost:${port}`, (res) => {
            // Anyresponse toEquasavltoEqualtoEqual(including 404, 500, etc.) means the server is up
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
          throw new Error(`Container failed to start after ${maxAttempts} attempts`)
        }

        // Wait 1 second before next attempt
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }
}
