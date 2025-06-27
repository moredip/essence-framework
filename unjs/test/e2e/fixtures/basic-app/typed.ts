interface User {
  name: string
  age: number
}

export default function (): string {
  const user: User = {
    name: "TypeScript",
    age: 15,
  }

  return `Hello from ${user.name}, age ${user.age}`
}
