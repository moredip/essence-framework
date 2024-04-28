const LOGGER = {
  log: console.log,
  info: console.info,
  debug: (...x:any) => {},
  warn: console.warn,
  error: console.error,
}

if(process.env['SNZ_DEBUG']){
  LOGGER.debug = console.debug
}

export default LOGGER
