import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Dedicated Vitest config — kept separate from vite.config.ts so the dev-server
// proxy / build settings there don't leak into the test run. Path aliases mirror
// vite.config.ts + tsconfig.json so imports resolve identically under test.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'next/link', replacement: path.resolve(__dirname, 'src/compat/next-link.tsx') },
      { find: 'next/navigation', replacement: path.resolve(__dirname, 'src/compat/next-navigation.ts') },
      { find: 'next/image', replacement: path.resolve(__dirname, 'src/compat/next-image.tsx') },
      {
        find: '@matrimony/shared-core',
        replacement: path.resolve(__dirname, 'packages/shared-core/src/index.ts'),
      },
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
