import * as walk from 'walkdir'

export default async function essence(apiPath: string) {
  console.log(`booting server for ${apiPath}...`)

  const apiFiles = await walk.async(apiPath)

  apiFiles.forEach((file) => {
    console.log(`building route for ${file}...`)
    // const actionHandler = import(file)
  })
}
