// File with multiple conflicting exports - both GET/get and PUT/put conflicts
export function GET() {
  return "Uppercase GET"
}

export function get() {
  return "Lowercase get"
}

export function PUT() {
  return "Uppercase PUT"
}

export function put() {
  return "Lowercase put"
}
