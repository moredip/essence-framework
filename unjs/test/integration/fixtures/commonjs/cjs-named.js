// CommonJS module with named exports
exports.GET = function() {
  return "Hello from CommonJS GET"
}

exports.POST = function(ctx) {
  return { message: "Created from CommonJS POST", data: ctx }
}