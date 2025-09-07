import { defineConfig } from "vitest/config"
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["**/*.stories.*", "**/*.config.*", "**/vitest.*", "**/__mocks__/**"],
      reporter: ["text", "html", "lcov"],
    },
  },
})
