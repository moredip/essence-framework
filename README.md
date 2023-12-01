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

- [ ] support for different methods
- [x] support for returning JSON
  - if we return an object, serialize to pretty json, and set mimetype/contenttype
- [x] handle non-thenable action handler
- [x] support for exporting static text
- [x] support for exporting static object as JSON
- Static support
  - [ ] support for static text file
  - [ ] support for static JSON file
  - [ ] support for static HTML file
  - [ ] support for e.g. /foo/index.json
  - [ ] support for _static dir with arbitrary contents
- [ ] next style paths (/foo/[bar].js rather than /foo/:bar.js)
- [ ] clear helpful feedback if a server file exports something that won't be used
  - e.g. a function called 'POST' rather than POST
- [ ] automatically open browser when server starts
- [ ] auto-reload when server files change
