import { routePathWithBase } from './autoDiscovery'
describe('autoDiscovery', () => {
  describe('routePath', () => {
    const routePath = routePathWithBase('/base')
    test('/index.ts', () => {
      const result = routePath('/base/index.ts')
      expect(result).toBe('/')
    })
    test('/blah.ts', () => {
      const result = routePath('/base/blah.ts')
      expect(result).toBe('/blah')
    })
    test('/foo/bar/index.ts', () => {
      const result = routePath('/base/foo/bar/index.ts')
      expect(result).toBe('/foo/bar')
    })
    test('/foo/bar/blah.ts', () => {
      const result = routePath('/base/foo/bar/blah.ts')
      expect(result).toBe('/foo/bar/blah')
    })

    test('/foo/bar/:userId.ts', () => {
      const result = routePath('/base/foo/bar/:userId.ts')
      expect(result).toBe('/foo/bar/:userId')
    })

    test('/foo/bar/:userId/index.ts', () => {
      const result = routePath('/base/foo/bar/:userId/index.ts')
      expect(result).toBe('/foo/bar/:userId')
    })
  })
})
