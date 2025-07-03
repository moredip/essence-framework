// File with no exports - should be ignored by the scanner
console.log("This file has no exports")

function internalFunction() {
  return "This is not exported"
}

const internalVariable = "This is also not exported"