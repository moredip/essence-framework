import { stdout } from "process"
import essence from "../lib/entryPoint"

require("ts-node/register")

export default async function main(argv: string[]) {
  const targetDir = argv[2] || "."

  splash()

  const essenceServer = await essence(targetDir)
  await essenceServer.startServer()
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
