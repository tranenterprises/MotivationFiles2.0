const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Map ESM imports for Supabase functions
    '^https://esm\\.sh/@supabase/supabase-js@2$': '@supabase/supabase-js',
    '^https://esm\\.sh/openai@4\\.28\\.0$': 'openai',
    '^https://esm\\.sh/@elevenlabs/elevenlabs-js@2$':
      '@elevenlabs/elevenlabs-js',
  },
  // Handle different test environments
  projects: [
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.{js,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/supabase/functions/**/*.test.{js,ts}',
        '<rootDir>/src/app/api/**/*.test.{js,ts}',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.node.js'],
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            useESM: true,
            tsconfig: {
              module: 'esnext',
            },
          },
        ],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^https://esm\\.sh/@supabase/supabase-js@2$': '@supabase/supabase-js',
        '^https://esm\\.sh/openai@4\\.28\\.0$': 'openai',
        '^https://esm\\.sh/@elevenlabs/elevenlabs-js@2$':
          '@elevenlabs/elevenlabs-js',
        '^https://esm\\.sh/@elevenlabs/elevenlabs-js@0\\.8\\.0$':
          '@elevenlabs/elevenlabs-js',
      },
      extensionsToTreatAsEsm: ['.ts'],
    },
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
