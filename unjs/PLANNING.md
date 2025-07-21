## Design Thoughts

### Dev Mode
We need to add a overall concept of "dev mode" vs. "prod mode". Using NODE_ENV makes the most sense here. o

In dev mode we'd do things like:
- awesome dev server console
- very verbose error responses
  - 404 would let you create the file on the fly


### Dependencies
What's the devex for this? A special file which exports some function that bootstraps deps?

How are deps exposed?

How about a `__dependencies__.ts` file which exports symbols. Either a constant that's just the dependency, or a function which is called every time? Or why not just always make it a function.

Pressure test it with a real example: connecting to a mongo data store. How would that work?

```
import {MongoClient} from 'some-mongo-sdk'

function initMongo(){
    return MongoClient({apiKey=process.env.MONGO_API_KEY})
}
const MONGO_CLIENT = initMongo()

export function mongoClient(){
    return MONGO_CLIENT
}
```

Then these would be exposed in the context that's passed to each endpoint function (as `deps` probably)

``` /todos/:todoId.tsx
function GET({queryParams,deps}){
    const {todoId} = queryParams
    const todo = deps.mongoClient().lookupDoc(`/todoDocs/{todoId}`)
    /// etc
}
```

I think there are some gotchas I haven't thought about re: dependency injection and scope management. There might be certain scenarios where the interactions are super inefficient, or super clunky.


## Feature Roadmap

- [x] auto-reload
- [ ] catch exceptions, return 500 response 
- [ ] Support for static files
  - Specific filetypes should be added as routes, served up as static content with the correct mimetypes
  - .json, .html, .png, .jpg, .svg
  - file watching should work on those files
- [ ] automatically launch server in browser when dev mode server starts
- [ ] support arbitrary ports, use port-please (or whatever the unjs package is called) to pick an open port
- [ ] 404 page has a button which will actually create the missing endpoint file
  - [ ] basic mode: hardcoded to just create a TSX file 
  - [ ] fancy mode: choose which methods to support, what type of response it should generate (HTML, JSON)

### Awesome dev server console
- [ ] clickable interactive log
- [ ] Route map
- [ ] various keybindings to do various things

### Laundry List
- [ ] support for different methods (PUT, DELETE, etc)
- Request Inputs
  - [ ] path params
  - [ ] query params
  - [ ] body as JSON/form
    - using `body-parser`, probably
  - [ ] raw body
  - [ ] request headers?
  - [ ] cookies?
- Outputs
  - [ ] controlling status code
  - [ ] controlling response headers
  - [ ] making redirects (ergonomic sugar on top of status code and headers)
- [ ] support for returning JSON
  - if we return an object, serialize to pretty json, and send correct content-type response header
- [ ] handle non-thenable action handler
- [ ] support for exporting static text
    - if return value is a string, return a plaintext response with that string
- [ ] support for exporting static object as JSON
    - if return value is a JS object, return a json response 

- [ ] "Fully Baked" mode that pre-compiles the final server, packages it up in a self-sufficient bundle that can just run