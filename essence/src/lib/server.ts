import express from "express"
import { renderSSR } from "nano-jsx"
import { AddressInfo } from "net"
import logger from "./logger"
import { createRouter, RegisterRoutesFn } from "./router"
import { Server } from "http"
import { promisify } from "util"

require("ts-node").register({
  compilerOptions: {
    jsx: "react-jsx",
    jsxImportSource: "nano-jsx/lib",
  },
})

// hacky way to get nano to setup `global.document`, which needs to be done
// before any JSX actions are executed.
renderSSR(null)

export type EssenceServer = {
  startServer: () => Promise<void>
  stopServer: () => Promise<void>
  registerPathActions: RegisterRoutesFn
  getBoundPort: () => number | null
}

export async function createServer(port = 3553): Promise<EssenceServer> {
  const app = express()
  const router = createRouter(app)

  let boundPort: number | null = null
  let server: Server | null = null
  async function startServer() {
    return new Promise<void>((resolve, reject) => {
      server = app.listen(port, () => {
        // boundPort could be different than port if port === 0
        boundPort = (server!.address() as AddressInfo).port
        logger.info(`Essence started on port ${boundPort}`)
        resolve()
      })
    })
  }

  async function stopServer() {
    await promisify(server!.close).apply(server)
  }

  return {
    startServer,
    stopServer,
    registerPathActions: router.registerPathActions,
    getBoundPort: () => boundPort,
  }
}
