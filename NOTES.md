## Getting Started
```
cd essence
pnpm install
pnpm build
cd ../examples/

node ../essence/dist/cli/essence.js basic
```

## DESIGN DECISIONS

### how to accept different types of input to an action
- path params
- query params
- body params (e.g. JSON in a POST)
- raw body (e.g. JSON in a POST)
- cookies
- headers

react-query style, a giant object that you can destructure what you need from:

action( {path_params,query_params,body,req,res,etc,etc} )

### How do we want to support redirects
- throw a special sort of exception?
- return a special type?

similarly, how do we want to manage status codes?
similarly, how do we want to manage response headers?

I think we can punt on a lot of these for 1.0

## TODO

### Big ticket items for "1.0"

Must have:
- [x] request bodies
- [x] pop the hood to express
- [x] auto-reload
- [x] catch exceptions, return 500 response 
- [ ] deployment story
  - build a docker image for a given directory
  - 1-liner to run pre-baked image against a given directory
  - ideally, the former using the latter (as an image layer) 
- [ ] good docs, killer tutorial
  - https://codesandbox.io/ template?
- [x] support for static JSON, HTML files

Should have:
- [x] open browser on start
- [ ] *extremely* smooth deploy to something like Vercel, fly.io 
  - repl.it?
- [ ] status codes, response headers

Nice to have:
- [x] dynamic JSX-powered HTML
  - [ ] that works with `npx snz foo`

### laundry list

Basics
- [x] support for different methods
- [x] gracefully handle bad action files
- Inputs
  - [x] path params
  - [x] query params
  - [x] body as JSON/form
    - using `body-parser`, probably
  - [ ] raw body
  - [ ] request headers?
  - [ ] cookies?
- Outputs
  - [ ] controlling status code
  - [ ] controlling response headers
  - [ ] making redirects (ergonomic sugar on top of status code and headers)
- [x] support for returning JSON
  - if we return an object, serialize to pretty json, and send correct content-type response header
- [x] handle non-thenable action handler
- [x] support for exporting static text
- [x] support for exporting static object as JSON
- Static support
  - [x] support for static text file
  - [x] support for static JSON file
  - [x] support for static HTML file
  - [] support for static 'anything else' file (e.g. css)
  - [x] support for e.g. /foo/index.json
    - [ ] gracefully handle competing index. files (e.g. an index.txt AND index.ts in the same dir)
  - [ ] support for _static dir with arbitrary contents
  - [ ] send the correct content-type response header in all cases
- [ ] next style paths (/foo/[bar].js rather than /foo/:bar.js)
  - this could be tricky because we're leaning directly on Express's routing system

Advanced/low-level features
- [ ] support for streaming
  - if an action returns a stream?
- [x] escape hatch to directly define an express handler
  - maybe by exporting `expressGet`, `expressPost`, `expressAll`, and so on
  - or better, maybe `withExpressRoute` that would create and inject an express route as a param, which could then be used to call `route.get()`. See [app.route(...)](https://expressjs.com/en/4x/api.html#app.route) for more
  
- Ergonomics
- [ ] magic 404 page in dev mode which creates a template file for you if you press a button
- [ ] synonyms for `pathParams`, `queryParams`, etc. `p` and `q`?
- [ ] support `export GET` as synonym for `export get`.
- [ ] clear graceful error is the specified server dir doesn't exist - current error is extremely **cryptic**
- [ ] clear helpful feedback if a server file exports something that won't be used
  - e.g. a function called 'POST' rather than post
- [x] automatically open browser when server starts
  - [x] don't re-open browser on auto-reload
- [x] auto-reload when server files change
- [ ] Docker packaging
- [ ] `snz demo` creates a demo service which you can play with straight away
- [ ] dev server: press a key to see all the routes
- [ ] logging of each request
- [ ] use [ink](https://github.com/vadimdemedes/ink) to build a really fancy dev CLI

## TO DOCUMENT
- [ ] rules for routing (re-state [express rules](https://expressjs.com/en/guide/routing.html))
  - path params
- [ ] how to handle different request methods
  - default function vs named function
  - can do a named get if you prefer 
  - other functions will be ignored
- [ ] different types of responses
  - [ ] a string
  - [ ] an object
  - [ ] a buffer
- [ ] all the different ways to define an action
  - [ ] export a function
  - [ ] export a constant
  - [ ] add a static file
  - [ ] ?? _static dir ??

