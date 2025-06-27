import { renderSSR } from "nano-jsx"
import type { EventHandler, H3Event } from "h3"

/**
 * Converts an endpoint function into an h3-compatible event handler
 */
export function createEndpointHandler(endpointFunction: Function): EventHandler {
  return async (event) => {
    try {
      const result = await endpointFunction()
      return await processResponse(result, event)
    } catch (error) {
      console.error(`Error handling ${event.node.req.method} ${event.node.req.url}:`, error)
      return "Internal server error"
    }
  }
}

/**
 * Processes the result from an endpoint function into an appropriate HTTP response
 */
async function processResponse(result: unknown, event: H3Event) {
  if (isJSXElement(result)) {
    // Render JSX to HTML
    const html = renderSSR(result)
    event.node.res.setHeader("content-type", "text/html")
    return html
  } else if (typeof result === "object" && result !== null) {
    // JSON response
    event.node.res.setHeader("content-type", "application/json")
    return JSON.stringify(result)
  } else {
    // String or other response
    event.node.res.setHeader("content-type", "text/plain")
    return String(result)
  }
}

/**
 * Detects if a value is a JSX element (supports both React-style and nano-jsx)
 */
function isJSXElement(value: unknown): boolean {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    value !== null &&
    // React-style JSX
    (("type" in value && "props" in value) ||
      // nano-jsx style
      ("tagName" in value && "nodeType" in value && (value as any).nodeType === 1))
  )
}