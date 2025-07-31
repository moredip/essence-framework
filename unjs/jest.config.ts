import type { Config } from "jest"
import { createDefaultEsmPreset } from "ts-jest"

const presetConfig = createDefaultEsmPreset()

export default {
  ...presetConfig,
  displayName: "ts-only",
  testEnvironment: "node",
  setupFilesAfterEnv: ["jest-extended/all"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
} satisfies Config
