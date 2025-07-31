/**
 * HTTP methods supported by the framework
 */
export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
] as const

/**
 * Union type of all supported HTTP methods
 */
export type HttpMethods = (typeof HTTP_METHODS)[number]

/**
 * HTTP methods in lowercase (for h3 router compatibility)
 */
export type HttpMethodsLowercase = Lowercase<HttpMethods>

/**
 * Context object passed to endpoint handlers
 */
export interface EndpointContext {
  /** Query parameters from the URL */
  query: Record<string, string | string[]>
}

/**
 * Type for endpoint handler functions
 */
export type EndpointHandler = (
  context: EndpointContext,
) => unknown | Promise<unknown>
