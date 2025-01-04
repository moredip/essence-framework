import logger from "./logger";

export default function bootstrap(app: any) {
    // assumes snz is located inside node_modules.
    let bootstrapFilePath = '../../../../bootstrap'
  
    // @ts-ignore assumes there is a bootstrap module in in app's project root folder.
    import(bootstrapFilePath).then(bootstrap => {
      bootstrap.default(app)
    }).catch(e => {
      import(`${bootstrapFilePath}.js`).then(bootstrap => {
        bootstrap.default(app)
      }).catch(e => {
        logger.info(e)
        logger.info(`[INFO] No bootstrap.ts/bootstrap.js module found. ${e.message.split(" imported ")[0]}.`)
      })
    })
  }