// Node.js environment setup for API route testing

// Set up test environment variables
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key'  
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.CRON_SECRET = 'test-cron-secret'
process.env.ADMIN_SECRET = 'test-admin-secret'
process.env.NODE_ENV = 'development'

// Mock global fetch for Node.js environment
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    headers: new Map(),
  })
)

// Mock TextEncoder/TextDecoder for Node.js
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder