import { createActionsFromModuleExports } from "./actionImporter"

describe("actionImporter", () => {
  describe("code actions", () => {
    it("interprets a naked function export", async () => {
      const someFunctionAction = () => "response"

      const exports = someFunctionAction
      const actions = createActionsFromModuleExports(exports)

      expect(actions.get).toBeInstanceOf(Function)
      expect(actions.post).toBeNull()
      expect(actions.patch).toBeNull()
      expect(actions.put).toBeNull()
      // etc.
    })
    it("interprets a default function export", async () => {
      const someFunctionAction = () => "response"

      const exports = {
        default: someFunctionAction,
      }
      const actions = createActionsFromModuleExports(exports)

      expect(actions.get).toBeInstanceOf(Function)
      expect(actions.post).toBeNull()
      expect(actions.patch).toBeNull()
      expect(actions.put).toBeNull()
      // etc.
    })

    it("interprets delete_ as a DELETE action (because `delete` is a reserved keyword and can't be es6 exported)", async () => {
      const someFunctionAction = () => "response"

      const exports = {
        delete_: someFunctionAction,
      }
      const actions = createActionsFromModuleExports(exports)

      expect(actions.delete).toBeInstanceOf(Function)
    })
    it("also supports delete as a DELETE action (because cjs does support a named export called `delete`)", async () => {
      const someFunctionAction = () => "response"

      const exports = {
        delete: someFunctionAction,
      }
      const actions = createActionsFromModuleExports(exports)

      expect(actions.delete).toBeInstanceOf(Function)
    })

    test.todo("converts exported string into a static action")
    test.todo("converts exported object into a static action")

    // FUTURE FEATURES
    test.todo("allows uppercase named exports (but warns about duplicate exports)")
    test.todo("warns when both default and get are exported")
    test.todo("warns when multiple delete actions are exported (e.g. delete and also delete_)")
    test.todo("warns for unrecognized named exports")
  })
})
