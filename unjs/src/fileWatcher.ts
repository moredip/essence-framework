import * as chokidar from "chokidar"
import { EventEmitter } from "node:events"
import path from "node:path"

export interface FileChangeEvent {
  type: "add" | "change" | "unlink"
  filePath: string
  relativePath: string
}

export class FileWatcher extends EventEmitter {
  private watcher?: chokidar.FSWatcher
  private sourceDir: string
  private debounceTimeout?: NodeJS.Timeout
  private pendingChanges = new Set<string>()

  constructor(sourceDir: string) {
    super()
    this.sourceDir = path.resolve(sourceDir)
  }

  start(): void {
    if (this.watcher) {
      return // Already watching
    }

    this.watcher = chokidar.watch(this.sourceDir, {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/build/**",
        "**/*.map",
        "**/.*", // Hidden files
      ],
      ignoreInitial: true,
      persistent: true,
    })

    this.watcher
      .on("add", (filePath: string) => this.handleFileChange("add", filePath))
      .on("change", (filePath: string) =>
        this.handleFileChange("change", filePath),
      )
      .on("unlink", (filePath: string) =>
        this.handleFileChange("unlink", filePath),
      )
      .on("error", (error: unknown) => {
        console.error("File watcher error:", error)
        this.emit("error", error)
      })
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = undefined
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
      this.debounceTimeout = undefined
    }

    this.pendingChanges.clear()
    console.log("File watcher stopped")
  }

  private handleFileChange(
    type: FileChangeEvent["type"],
    filePath: string,
  ): void {
    // Add to pending changes
    this.pendingChanges.add(filePath)

    // Debounce rapid changes
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }

    this.debounceTimeout = setTimeout(() => {
      const changes: FileChangeEvent[] = []

      for (const pendingPath of this.pendingChanges) {
        changes.push({
          type,
          filePath: pendingPath,
          relativePath: path.relative(this.sourceDir, pendingPath),
        })
      }

      this.pendingChanges.clear()

      if (changes.length > 0) {
        console.log(`🔄 Detected ${changes.length} file change(s)`)
        console.debug(
          "Changed files:",
          changes.map((c) => c.relativePath).join(", "),
        )
        this.emit("changes", changes)
      }
    }, 100) // 100ms debounce
  }
}
