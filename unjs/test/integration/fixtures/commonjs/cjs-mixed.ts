// TypeScript file with both CommonJS and ES6 exports
exports.GET = function () {
  return "Hello from TypeScript CommonJS GET"
}

export const POST = () => {
  return "Hello from TypeScript ES6 POST"
}

module.exports.PUT = function () {
  return "Hello from TypeScript CommonJS PUT"
}
