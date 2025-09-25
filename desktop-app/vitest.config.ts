/**
 * Vitest Configuration for Desktop Application
 * Phase 4: Testing & Deployment Implementation
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/renderer/__tests__/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/main/',
        '__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'build/',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 75,
          statements: 75,
        },
      },
    },
    include: [
      'src/renderer/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'src/main',
      '**/*.d.ts',
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    silent: false,
    watch: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@components': path.resolve(__dirname, './src/renderer/components'),
      '@utils': path.resolve(__dirname, './src/renderer/utils'),
      '@services': path.resolve(__dirname, './src/renderer/services'),
      '@stores': path.resolve(__dirname, './src/renderer/stores'),
      '@constants': path.resolve(__dirname, './src/renderer/constants'),
      '@types': path.resolve(__dirname, './src/renderer/types'),
      '@assets': path.resolve(__dirname, './src/renderer/assets'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
    ],
  },
})
