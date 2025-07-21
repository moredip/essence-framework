import type { Config } from "jest"
import { createDefaultEsmPreset } from "ts-jest"

export default {
  displayName: "ts-only",
  testEnvironment: "node",
  setupFilesAfterEnv: ["jest-extended/all"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  ...createDefaultEsmPreset(),
} satisfies Config
