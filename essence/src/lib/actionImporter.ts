import path from "path"
import { makeStaticFileAction, normalizeImportedAction } from "./actionAdapter"
import { PathActions, buildPathActions } from "./types"

export async function loadActionsFromFile(handlerPath: string): Promise<PathActions> {
  switch (path.extname(handlerPath)) {
    case ".js":
    case ".ts":
      return await loadActionsFromCodeFile(handlerPath)
    case ".txt":
      return await loadActionsFromTextFile(handlerPath)
    default:
      throw `unrecognized extension for server file ${handlerPath}`
  }
}

async function loadActionsFromCodeFile(handlerPath: string): Promise<PathActions> {
  const moduleExportsFromFile = await import(handlerPath)
  return createActionsFromModuleExports(moduleExportsFromFile)
}

async function loadActionsFromTextFile(handlerPath: string): Promise<PathActions> {
  const fileAction = makeStaticFileAction(handlerPath)
  return buildPathActions({ get: fileAction })
}

export function createActionsFromModuleExports(exports: any): PathActions {
  if (typeof exports === "function") {
    return buildPathActions({ get: normalizeImportedAction(exports) })
  }

  // TODO: warn if both get and default were exported
  const get = normalizeImportedAction(exports.get || exports.default || null)
  const post = normalizeImportedAction(exports.post || null)
  const put = normalizeImportedAction(exports.put || null)
  const patch = normalizeImportedAction(exports.patch || null)
  // TODO: warn if both delete and delete_ were exported
  const delete_ = normalizeImportedAction(exports.delete || exports.delete_ || null)
  const options = normalizeImportedAction(exports.options || null)
  return { get, post, put, patch, delete: delete_, options }
}
