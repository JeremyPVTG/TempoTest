import { setupServer } from 'msw/node'
import { storefrontHandlers } from './handlers/storefront'

// Combine all handlers
export const handlers = [
  ...storefrontHandlers
]

// Create MSW server for Node.js (testing)
export const server = setupServer(...handlers)

// Export test utilities
export { mockStorefront } from './handlers/storefront'

// Setup for vitest
export function setupMSW() {
  if (typeof global !== 'undefined') {
    const globalAny = global as any
    if (globalAny.beforeAll) {
      globalAny.beforeAll(() => {
        server.listen({ onUnhandledRequest: 'warn' })
      })
      
      globalAny.afterEach(() => {
        server.resetHandlers()
      })
      
      globalAny.afterAll(() => {
        server.close()
      })
    }
  }
}