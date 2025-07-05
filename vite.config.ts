import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',           // Simulates browser environment
    globals: true,                  // Use global test functions (describe, it, expect)
    setupFiles: './src/setupTests.ts', // (Optional) Setup file for global test setup
  },
  server: {
    open: true,
    port: 3000,
  }
})
