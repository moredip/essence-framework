// File with valid HTTP methods and some non-standard exports
export function GET() {
  return "Valid GET handler"
}

export function someHelper() {
  return "This is not an HTTP method"
}

export const config = {
  timeout: 5000,
}

export const INVALID_METHOD = () => {
  return "Not a valid HTTP method"
}
