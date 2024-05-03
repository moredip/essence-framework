# Essence - the ridiculously simple web service framework

Essence is a web framework focused on building simple HTTP servers with zero boilerplate. 

```
mkdir my_server 
echo '<h1>hello, world</h1>' > my_server/index.html
npx snz my_server
```
and you're ready to go. 

`snz` will serve up whatever you put in that directory. No `package.json`. No `create-snz-app` or `snz init` and answering 17 questions. Just point `npx snz` at a directory.

## demo

[![Essence Demo](http://img.youtube.com/vi/wgosoWAkhZA/0.jpg)](http://www.youtube.com/watch?v=wgosoWAkhZA "Building a custom web service in 2 minutes, with Essence")

## snz serves up static files (boring...)
Add a static file (`index.html`, `hello.txt`, ...) and snz will serve those files up as is.

Add a JSON file (`index.json`, `/mock/api/users/1.json`, ...) and snz will serve it up with the appropriate headers.

## snz lets you write API endpoints with zero boilerplate (interesting!)

Add a `.js` or `.ts` file to your server directory and snz will execute it and serve the result.

### folder structure defines the routing 
`/api/users/food.ts` handles requests to `/api/users/food`

snz will call the function you define in that file. The return value of that function is the response body. Zero boilerplate.

```typescript
export default function(){
  return "hello, world"
}
```

return an object and snz will turn it into JSON
```typescript
export default function(){
  return {"hello": "world"}
}
```

### path parameters
Dynamic path parameters work as you'd expect: add `/api/users/:userId/food.ts` and your function in `food.ts` can access `userId` as a path param (with zero boilerplate)
```
export default function({pathParams}){
  const user = pathParams.userId
  return `greetings, user #${user}`
}
```

### Everything else you need to put together an API

query parameters (/search?query=123) are supported:
```
// search.js
export default function({queryParams}){
  const results = someFancySearchProcess(queryParams.query)
  return {results}
}
```

GETs, POSTs, PUTs, and so on are supported, with JSON- or url-form-encoded request bodies:
```
// api/an_endpoint/index.js

export function get(){
  return "You got what you get"
}

export function post({requestBody}){
  return {
    "you posted this to me": requestBody
  }
}

export function put({requestBody}){
  return "I got a PUT, but honestly didn't do much with what you sent me"
}
```


