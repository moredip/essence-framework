import { stdout } from "process"
import openBrowser from "react-dev-utils/openBrowser"
import essence from "../lib/entryPoint.js"

require("ts-node/register")

export default async function main(argv: string[]) {
  const targetDir = argv[2] || "."

  splash()

  const essenceServer = await essence(targetDir)
  await essenceServer.startServer()

  const serverUrl = `http://localhost:${essenceServer.getBoundPort()}`
  openBrowser(serverUrl)
}

function splash() {
  const banner = `


       ########  ######   ######  ######## ##    ##  ######  ######## 
     ##       ##    ## ##    ## ##       ###   ## ##    ## ##       
     ##       ##       ##       ##       ####  ## ##       ##       
     ######    ######   ######  ######   ## ## ## ##       ######   
     ##             ##       ## ##       ##  #### ##       ##       
     ##       ##    ## ##    ## ##       ##   ### ##    ## ##       
     ########  ######   ######  ######## ##    ##  ######  ######## 


  `
  stdout.write(banner)
}
