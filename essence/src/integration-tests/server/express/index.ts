import { IRoute, Request, Response } from "express"

export function withExpressRoute(route: IRoute) {
  route.get((req: Request, res: Response) => {
    res.end("from express get handler")
  })
  route.put((req: Request, res: Response) => {
    res.end("from express put handler")
  })
}
