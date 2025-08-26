import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>
  },
}))

// Set up test environment variables
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock Web APIs for server components
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Request for Next.js server components
Object.defineProperty(global, 'Request', {
  writable: true,
  value: class Request {
    constructor(input, init = {}) {
      // Handle NextRequest requirements
      Object.defineProperty(this, 'url', {
        value: typeof input === 'string' ? input : input.url || 'http://localhost:3000',
        writable: false,
        enumerable: true,
        configurable: false
      })
      
      Object.defineProperty(this, 'method', {
        value: init.method || 'GET',
        writable: false,
        enumerable: true,
        configurable: false
      })
      
      // Create a proper Headers-like object
      const headers = new Map()
      if (init.headers) {
        if (init.headers instanceof Map) {
          for (const [key, value] of init.headers) {
            headers.set(key.toLowerCase(), value)
          }
        } else if (typeof init.headers === 'object') {
          for (const [key, value] of Object.entries(init.headers)) {
            headers.set(key.toLowerCase(), value)
          }
        }
      }
      
      Object.defineProperty(this, 'headers', {
        value: {
          get: (name) => headers.get(name?.toLowerCase()),
          has: (name) => headers.has(name?.toLowerCase()),
          set: (name, value) => headers.set(name?.toLowerCase(), value),
          delete: (name) => headers.delete(name?.toLowerCase()),
          entries: () => headers.entries(),
          keys: () => headers.keys(),
          values: () => headers.values(),
          [Symbol.iterator]: () => headers[Symbol.iterator](),
        },
        writable: false,
        enumerable: true,
        configurable: false
      })
      
      this.body = init.body || null
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'))
    }
    
    text() {
      return Promise.resolve(this.body || '')
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0))
    }
    
    formData() {
      return Promise.resolve(new FormData())
    }
  }
})

Object.defineProperty(global, 'Response', {
  writable: true,
  value: class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this.ok = this.status >= 200 && this.status < 300
    }
    
    static json(object, options) {
      const body = JSON.stringify(object)
      return new Response(body, {
        ...options,
        headers: {
          'content-type': 'application/json',
          ...(options?.headers || {})
        }
      })
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'))
    }
    
    text() {
      return Promise.resolve(this.body || '')
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0))
    }
  }
})

// Mock Headers
Object.defineProperty(global, 'Headers', {
  writable: true,
  value: class Headers extends Map {
    constructor(init) {
      super(init ? Object.entries(init) : [])
    }
    
    get(name) {
      return super.get(name.toLowerCase())
    }
    
    set(name, value) {
      return super.set(name.toLowerCase(), value)
    }
    
    has(name) {
      return super.has(name.toLowerCase())
    }
    
    delete(name) {
      return super.delete(name.toLowerCase())
    }
  }
})

// Mock fetch for server components
global.fetch = jest.fn(() =>
  Promise.resolve(new Response('{}', { status: 200 }))
)