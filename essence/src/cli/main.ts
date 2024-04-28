import { stdout } from "process"
import openBrowser from "react-dev-utils/openBrowser"
import essence from "../lib/entryPoint.js"

export default async function main(argv: string[], isRestart: boolean = false) {
  const targetDir = argv[2] || "."

  if (isRestart) {
    restartSplash()
  } else {
    simpleSplash()
    // splash()
  }

  const essenceServer = await essence(targetDir)
  await essenceServer.startServer()

  const serverUrl = `http://localhost:${essenceServer.getBoundPort()}`
  if (!isRestart) {
    openBrowser(serverUrl)
  }
}

function restartSplash() {
  stdout.write(`


  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃                               ┃
  ┃      FILE CHANGE DETECTED     ┃
  ┃      restarting server...     ┃
  ┃                               ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `)
}

function simpleSplash() {
  const banner = `
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃          ⊹    ⊹    ⊹          ┃
  ┃      ⊰  Essence Server  ⊱     ┃
  ┃          ⊹    ⊹    ⊹          ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `
  stdout.write(banner)
}

function splash() {
  const banner = `
                                       ▄▄
                                ▄▓████████████▓▄▄
                             ▄█████▀▀       ▀▀█████▄
                           █████  ▄▓█▀  ▀▀      ▀████▄
                         ▄████▀▄█▀▀       ▄▄▓▄     ▀███
                 ▄▄▓▓██▓███████▀       ▄██████▌ ▄   ▐███▄
              ▄██████▀▀██████▀        ▐██▀  ███▀      ███  ▄▄▄▄
            ▄███▀      ▐████▌   ▄▓████▐██   ███▀▀   ▄▄██████████
           ▐███   ▄▓██████████████▀ █████   ██▌▄▓█████▀▀     ███
          ▄███ ▄███▀▀       ▀▀█▌     ████   ███▀▀▀           ███▓▄
       ▄████████▀             █▌      ███   ██      ▄▄▓█▀   ▀██████▄
     ▄███▀  ███   ▄████████████▌      ▐██   ██▄▄▓██████   ▄███▀  ████
    ▐███   ▐██     ▀███████████▌  ▓    ██   █████████▀   ▓███     ▀███
    ███ ▀▀  ███▄         ▀▀████▌  ▓█    █   ████████   ▄███▀    ██ ███▌
   ▓██▌ █    ▀████▓▄▄        ▀█▌  ▓█▌       ██████▀   ▓████▓███▄ ▀ ▐███
   ███▌ █▌    ▄▄████████▓▄    ▐▌  ▓██▄      █████   ▄█████▀▀ ███ ▀ ███▌
   ▓███ ██ ▄██████████████▌    ▌  ▓███      ███▀   ▀▀        ███  ▐███
    ███▌ ████▀    ▀▀███▀▀     █▌  ▓████    ▄██         ▄▄▄▓████▀ ▄███▌
    ▐█████████▄            ▄▓██▌  ████████████   ▄▄▓█████████▀ ▄████▀
      ███████████▓▄▄▄▄▄▄▓███████████▀ ▀▀▀▀▓███████████████████████▀
        ▀█████████████████████▀█▀▀   ▄▄▓▀▀▄▄▓█▓▄███████████████▀
           ▀▀████████▓▄▄███████▓▄▄   ▄▄▄▓█████████▀ ▄▄
                  ▀████████▀▀███████████████████▀   ▀██▓
                           ▓▌  ▀▀███████████▀          ▀
                                 ▄▄▄
                                  ▀███
  `
  stdout.write(banner)
}
