import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    env: {
      DATABASE_URL: 'mysql://syfte_user:y7Ur39mZ8Lpn2Df@db44.ch.euserv.net/syfte_db'
    }
  }
})