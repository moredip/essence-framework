import React from "react"
import { render, Box, Text, Newline } from "ink"
import { RouteInfo, ScanIssue } from "./endpointScanner.js"

const SplashLogo: React.FC = () => (
  <Box
    borderColor="cyan"
    borderStyle="round"
    padding={1}
    paddingX={8}
    flexDirection="column"
    alignItems="center"
  >
    <Text>{"⊹   ⊹    ⊹"}</Text>
    <Text bold color="cyanBright">
      {"⊰ Essence Dev Server ⊱"}
    </Text>
    <Text>{"⊹     ⊹  ⊹"}</Text>
  </Box>
)

interface RouteMapProps {
  routes: Map<string, RouteInfo>
  sourceDir: string
}

const RouteMap: React.FC<RouteMapProps> = ({ routes, sourceDir }) => {
  const routeEntries = Array.from(routes.entries())

  return (
    <Box
      alignSelf="flex-start"
      marginLeft={2}
      marginY={2}
      flexDirection="column"
      alignItems="flex-start"
    >
      <Text bold color="yellow">
        Routes
      </Text>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="yellow"
        paddingLeft={1}
        paddingRight={3}
      >
        {routeEntries.length === 0 ? (
          <Text dimColor>No routes found</Text>
        ) : (
          routeEntries.map(([routePath, routeInfo]) => (
            <Box key={routePath} marginLeft={1}>
              <Text color="green">
                [{Object.keys(routeInfo.handlers).join(", ")}]
              </Text>
              <Text> {routePath} </Text>
              <Text dimColor>({routeInfo.sourcePath})</Text>
            </Box>
          ))
        )}
      </Box>
      <Text dimColor italic>
        source: {sourceDir}
      </Text>
    </Box>
  )
}

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
  return (
    <Box flexDirection="column" padding={1}>
      <Box alignItems="center" flexDirection="column" margin={1}>
        <SplashLogo />
        <Text italic dimColor>
          running on
        </Text>
        <Text italic dimColor>
          {serverUrl}
        </Text>
      </Box>

      <RouteMap routes={routes} sourceDir={sourceDir} />

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
