const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/supabase/functions/_shared/__tests__'],
  testMatch: ['**/__tests__/**/*.test.{js,ts}'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Map ESM imports for Supabase functions
    '^https://esm\\.sh/@supabase/supabase-js@2$': '@supabase/supabase-js',
    '^https://esm\\.sh/openai@4\\.28\\.0$': 'openai',
    '^https://esm\\.sh/@elevenlabs/elevenlabs-js@2$':
      '@elevenlabs/elevenlabs-js',
    '^https://esm\\.sh/@elevenlabs/elevenlabs-js@0\\.8\\.0$':
      '@elevenlabs/elevenlabs-js',
  },
  setupFilesAfterEnv: [
    '<rootDir>/supabase/functions/_shared/__tests__/test-setup.ts',
  ],
  collectCoverageFrom: [
    'supabase/functions/_shared/**/*.ts',
    '!supabase/functions/_shared/**/*.test.ts',
    '!supabase/functions/_shared/__tests__/**/*',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        module: 'esnext',
      },
    },
  },
};
