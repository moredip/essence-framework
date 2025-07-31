export const GET = (context) => {
  const { query } = context
  return {
    name: query.name || "MISSING",
    age: query.age || "MISSING",
    allParams: query,
  }
}
