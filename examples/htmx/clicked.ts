export function post() {
  const time = new Date()
  return `Clicked at ${time.toISOString()}`
}
