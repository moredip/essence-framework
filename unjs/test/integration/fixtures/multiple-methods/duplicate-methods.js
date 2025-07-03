// This file has both uppercase and lowercase versions of the same HTTP method
// This should cause the scanner to fail since it's ambiguous which one to use

export const GET = () => {
  return "Hello from uppercase GET"
}

export const get = () => {
  return "Hello from lowercase get"
}