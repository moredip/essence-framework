# Essence Framework

> A minimalist web framework for zero-boilerplate APIs and HTML sites

## Quick Start

Create endpoint files and start serving:

```javascript
// src/hello.js
export const GET = () => {
  return { message: "Hello, world!" }
}
```

```bash
npx essence-framework ./src
# Server running at http://localhost:3000
# GET /hello → {"message":"Hello, world!"}
```

## Features

- **Zero Boilerplate** - Write a simple functions, get APIs. No setup, no config files, no routing tables
- **Zero Configuration** - File-based routing with convention over configuration
- **TypeScript & JSX Support** - Automatic runtime compilation of TypeScript and JSX/TSX
- **Multiple Response Types** - Return strings, objects (JSON), JSX (HTML), binary. Drop down to raw Response objects if you need.
- **Hot Reload** - Automatic file watching and route rebuilding during development
- **Simple API** - Export functions named after HTTP methods (`GET`, `POST`, etc.)
- **More Control, If You Want It** - Access headers, query params, form data, and more

## File-Based Routing

Your file structure becomes your API:

```
src/
├── index.js          → GET /
├── hello.js          → GET /hello
├── contact.js        → GET,POST /contact
└── users/
    ├── index.js      → GET,POST /users
    └── :id.js       → GET /users/:id
```

## Handler Examples

### Simple Text Response

```javascript
// src/index.js
export default function () {
  return "Hello, world!"
}
```

### JSON API

```javascript
// src/api/users.js
export const GET = () => {
  return { users: ["alice", "bob"] }
}

export const POST = ({ context }) => {
  const { body } = context
  // Create user logic here
  return { id: 123, ...body }
}
```

### HTML with JSX

```tsx
// src/contact.tsx
export const GET = () => {
  return (
    <form method="POST" action="/contact">
      <input name="email" placeholder="Your email" />
      <textarea name="message" placeholder="Your message" />
      <button type="submit">Send</button>
    </form>
  )
}

export const POST = ({ context }) => {
  const { formData } = context
  console.log("Form submission:", formData)
  return <h1>Thanks for your message!</h1>
}
```

### Dynamic Routes

```javascript
// src/users/[id].js
export const GET = ({ context }) => {
  const { pathParams } = context
  return { userId: pathParams.id }
}
```

## Context Object

Every handler receives a context object with:

```javascript
export const GET = ({ context }) => {
  const {
    headers, // Request headers
    cookies, // Parsed cookies
    query, // Query parameters
    pathParams, // Dynamic route segments
    body, // Parsed request body
    formData, // HTML form submissions
  } = context

  return { received: body }
}
```

## CLI Usage

```bash
# Start development server
npx essence-framework ./src

# With file watching (default in development)
npx essence-framework ./src --watch

# Disable file watching
npx essence-framework ./src --no-watch

# Custom directory
npx essence-framework ./my-api-dir
```

## Development

### Installation

```bash
npm install
```

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build TypeScript
npm run test     # Run tests
npm run lint     # Check formatting
```

### File Watching

The framework includes automatic file watching during development:

- **Detects changes** to `.ts`, `.tsx`, `.js`, `.jsx` files
- **Rebuilds routes** automatically without server restart
- **Hot module reloading** with cache invalidation
- **Debounced updates** to avoid rapid rebuilds

File watching is enabled by default in development and can be controlled via CLI flags.

## Architecture

For detailed technical design and implementation notes, see [DESIGN.md](./DESIGN.md).

- **Runtime**: Built on h3 (UnJS HTTP framework)
- **Transpilation**: Uses jiti for TypeScript/JSX runtime compilation
- **File Watching**: chokidar for efficient file system monitoring
- **SSR**: nano-jsx for server-side JSX rendering

## Testing

The framework includes comprehensive end-to-end tests using Docker containers to ensure isolation and proper testing of file watching functionality.

```bash
npm test
```

## Response Types

| Return Type | Content-Type       | Example                                   |
| ----------- | ------------------ | ----------------------------------------- |
| `string`    | `text/plain`       | `"Hello world"`                           |
| `object`    | `application/json` | `{ message: "Hi" }`                       |
| `JSX`       | `text/html`        | `<h1>Welcome</h1>`                        |
| `Response`  | Custom             | `new Response("Custom", { status: 201 })` |

---

_Essence Framework - Write functions, get APIs_ ✨
