/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts', './vitest.setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.stories.*',
        'src/stories/**',
        '**/*.config.*',
        '**/vitest.*',
        'src/components/ui/**',
        'src/main.tsx',
        'src/App.tsx'
      ],
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})