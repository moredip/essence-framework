## Getting Started
```
cd essence
pnpm install
pnpm build
cd ../examples/

node ../essence/dist/cli/essence.js basic
```


## TODO

- [ ] support for different methods
- [x] support for returning JSON
  - if we return an object, serialize to pretty json, and set mimetype/contenttype
- [ ] handle non-thenable action output
- [ ] support for static text
- [ ] support for static JSON
- [ ] support for static HTML
- [ ] support for _static dir with arbitrary contents
- [ ] automatically open browser when server starts
- [ ] auto-reload when server files change
