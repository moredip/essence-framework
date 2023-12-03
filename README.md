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

- [x] support for different methods
- Inputs
  - [ ] path params
  - [ ] query params
  - [ ] body as JSON
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
  - [ ] support for static JSON file
  - [ ] support for static HTML file
  - [ ] support for e.g. /foo/index.json
  - [ ] support for _static dir with arbitrary contents
  - [ ] send the correct content-type response header in all cases
- [ ] next style paths (/foo/[bar].js rather than /foo/:bar.js)
- [ ] clear helpful feedback if a server file exports something that won't be used
  - e.g. a function called 'POST' rather than POST
- [ ] automatically open browser when server starts
- [ ] auto-reload when server files change
- [ ] support for streaming
  - if an action returns a stream?
- [ ] escape hatch to directly define an express handler
  - maybe by exporting `expressGet`, `expressPost`, `expressAll`, and so on
  - or better, maybe `withExpressRoute` that would create and inject an express route as a param, which could then be used to call `route.get()`. See [app.route(...)](https://expressjs.com/en/4x/api.html#app.route) for more


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

