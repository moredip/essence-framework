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
  const importedActions = await import(handlerPath)
  return createActionsFromCodeImports(importedActions)
}

async function loadActionsFromTextFile(handlerPath: string): Promise<PathActions> {
  const fileAction = makeStaticFileAction(handlerPath)
  return buildPathActions({ get: fileAction })
}

function createActionsFromCodeImports(importedActions: any): PathActions {
  if (typeof importedActions === "function") {
    return buildPathActions({ get: importedActions })
  }

  const get = normalizeImportedAction(importedActions.get || importedActions.default || null)
  const post = normalizeImportedAction(importedActions.post || null)
  const put = normalizeImportedAction(importedActions.put || null)
  const patch = normalizeImportedAction(importedActions.patch || null)
  // TODO: also support `delete` being exported
  const delete_ = normalizeImportedAction(importedActions.delete_ || null)
  const options = normalizeImportedAction(importedActions.options || null)
  return { get, post, put, patch, delete: delete_, options }
}
