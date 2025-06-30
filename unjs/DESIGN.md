# 🛠️ Technical Design Doc: “Essence Framework”

_A minimalist web framework for zero-boilerplate APIs and HTML sites_

---

## 👁️ Guiding Principles

1. **Remove Incidental Complexity**\
   Users should never have to think about routing, serialization, or server setup for basic use cases. They just write functions.

2. **Convention over Configuration**\
   File system structure defines route structure. HTTP method and URL path are inferred from file path and export names.

3. **Strong Defaults, Optional Escape Hatches**\
   90% of users should never have to touch headers, status codes, or serialization logic — but advanced users can drop down to raw `Response` objects.

4. **Developer Joy is a First-Class Goal**\
   Fast feedback, helpful errors, and clear mental models beat performance or extensibility at this stage.

5. **Graduation is Expected**\
   The framework is ideal for MVPs, BFFs, mock APIs, or internal tools — and is designed to be outgrown. The upgrade path to full-featured frameworks should be smooth.

---

## ✨ Quick Demo

Here’s everything you need to build a working JSON API and HTML form handler:

```ts
// src/hello.ts
export const GET = () => {
  return { message: "Hello, world!" }
}
```

```ts
// src/contact.ts
export const GET = () => {
  return (
    <form method="POST">
      <input name="email" />
      <textarea name="message" />
      <button type="submit">Send</button>
    </form>
  );
};

export const POST = ({ context }) => {
  const { formData } = context;
  // send an email, write to DB, etc.
  return "Thanks for contacting us!";
};
```

Start a server from the CLI:

```sh
npx essence-framework ./src
```

---

## 🧹 API and Semantics

### ✅ Handlers

Handlers are functions exported from files in a `src/` directory. The export name matches an HTTP method (`GET`, `POST`, etc.).

Each file maps to a route. For example:

| File                | Route        | Methods     |
| ------------------- | ------------ | ----------- |
| `src/index.ts`      | `/`          | GET         |
| `src/contact.ts`    | `/contact`   | GET, POST   |
| `src/users/[id].ts` | `/users/:id` | GET, DELETE |

Handlers can be:

- Synchronous or asynchronous
- Pure (no args), or take a single `{ context }` argument

```ts
export const GET = ({ context }) => {
  return { userAgent: context.headers["user-agent"] }
}
```

### 🧰 `context` Object

A standard object passed into all handlers, containing:

- `context.headers`: request headers
- `context.cookies`: parsed cookies
- `context.query`: query params
- `context.pathParams`: values from dynamic route segments
- `context.body`: parsed request body (JSON or form data)
- `context.formData`: parsed HTML form submissions
- `context.user`: optional auth/user info (TBD)
- (future) `context.dependencies`: optional DI surface

### 📦 Return Values

Handlers can return:

| Return Type | Interpreted As              |
| ----------- | --------------------------- |
| `string`    | `text/plain` body           |
| `object`    | JSON body                   |
| `JSX`       | HTML page (SSR rendered)    |
| `Response`  | Raw response (escape hatch) |

Status code and content-type are inferred unless you use `Response`.

### ⚠️ Errors

Throwing a custom exception like `new NotFound()` will map to 404. Throwing a plain `Error` returns a 500. Helpful dev errors are shown in development mode.

### 🧪 Testing Helpers

- `createTestServer({ dir })`: boot a test-only in-memory server
- `server.get(path, overrides?)`: simulate a request
- `makeContext(overrides)`: generate fake request contexts

---

## 🏗️ High-Level Technical Design

### 📂 File-System Router

- A directory walker scans `src/` for files.
- File path maps to route path:
  - `/index.ts` → `/`
  - `/foo/bar.ts` → `/foo/bar`
  - `/users/[id].ts` → `/users/:id`
- Exported function names map to HTTP methods.

### 🧐 Runtime Core

- Each request is parsed into a `context`.
- A route matcher looks up the appropriate handler by method and path.
- Default response serialization (JSON, text, HTML) is applied automatically.
- Errors are caught and mapped to responses; stack traces shown in dev mode.

### 🔧 Dev Server

- Watches `src/` for changes, auto-restarts as needed.
- Serves HTML and JSON with proper content types.
- Pretty error overlays and 404 helpers in dev mode.

### 🧕️ Observability

- Pre-configured OpenTelemetry instrumentation.
- Default stdout logging of method, path, status, and duration.
- Trace IDs included if available.

### 🚀 CLI

```sh
npx essence-framework [dir]
```

- Boots dev server
- Validates route exports
- Prints route map
- Shows friendly errors for common footguns

> Dev mode might eventually support "create this file" links on 404 pages.

---

## 📈 Roadmap (Sketch)

| Phase       | Goals                                                               |
| ----------- | ------------------------------------------------------------------- |
| **MVP**     | File-based routing, context object, CLI dev server                  |
| **Phase 2** | SSR + HTML forms, test harness, default observability               |
| **Phase 3** | Basic auth/user support, response overrides, DX polish              |
| **Phase 4** | Optional build system, plugin model, framework-to-framework interop |
