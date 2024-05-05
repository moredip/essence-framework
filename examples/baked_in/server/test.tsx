// FIXME: export this at root of `snz` package
import {ActionContext} from 'snz/dist/lib/types'

export default function({queryParams}:ActionContext){
    return <h2>Hello, {queryParams.name}</h2>
}