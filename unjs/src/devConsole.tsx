import React from "react"
import { render, Box, Text } from "ink"
import { RouteInfo, ScanIssue } from "./endpointScanner.js"

export interface DevConsoleState {
  routes: Map<string, RouteInfo>
  issues: ScanIssue[]
  sourceDir: string
  serverUrl: string
}

const DevConsole: React.FC<DevConsoleState> = ({
  routes,
  issues,
  sourceDir,
  serverUrl,
}) => {
  // Convert routes Map to array for easier rendering
  const routeEntries = Array.from(routes.entries())

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        🚀 Essence Framework Dev Console
      </Text>
      <Text dimColor>Source directory: {sourceDir}</Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="yellow">
          📍 Route Map ({routeEntries.length} routes)
        </Text>

        {routeEntries.length === 0 ? (
          <Text dimColor>No routes found</Text>
        ) : (
          routeEntries.map(([routePath, routeInfo]) => (
            <Box key={routePath} marginLeft={2}>
              <Text color="green">
                [{Object.keys(routeInfo.handlers).join(", ")}]
              </Text>
              <Text> {routePath} </Text>
              <Text dimColor>({routeInfo.sourcePath})</Text>
            </Box>
          ))
        )}
      </Box>

      {issues.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="red">
            ⚠️ Issues ({issues.length})
          </Text>
          {issues.map((issue: ScanIssue, index: number) => (
            <Box key={index} marginLeft={2}>
              <Text color={issue.severity === "error" ? "red" : "yellow"}>
                {issue.severity.toUpperCase()}:
              </Text>
              <Text>
                {" "}
                {issue.filePath}: {issue.message}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Server running on {serverUrl}</Text>
      </Box>
    </Box>
  )
}

let appInstance: any = null

export function startDevConsole(initialState: DevConsoleState) {
  if (appInstance) {
    appInstance.unmount()
  }

  appInstance = render(<DevConsole {...initialState} />)
  return appInstance
}

export function updateDevConsole(newState: DevConsoleState) {
  if (appInstance) {
    appInstance.rerender(<DevConsole {...newState} />)
  } else {
    throw new Error("Console not started yet")
  }
}

export function refreshDevConsole(newState: DevConsoleState): void {
  try {
    updateDevConsole(newState)
  } catch (error) {
    // Console not yet started, start it
    startDevConsole(newState)
  }
}
