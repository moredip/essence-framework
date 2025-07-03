interface User {
  name: string
  age: number
}

export const GET = (): string => {
  const user: User = {
    name: "TypeScript",
    age: 15,
  }
  return `Hello from ${user.name}, age ${user.age}`
}

export const POST = () => {
  return "I created a user!"
}
