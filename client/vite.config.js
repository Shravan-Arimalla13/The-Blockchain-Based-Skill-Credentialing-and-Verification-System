import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from 'vite-jsconfig-paths'
import path from 'path' // <-- This was missing or caused the error
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), jsconfigPaths(),tailwindcss()],
  base: '/', // Ensure this is correct for Vercel routing
  server: {
    host: true,
    port: 5173
  },
  resolve: {
    alias: {
      // Forces browser-compatible buffer
      buffer: 'buffer/',
      // Properly resolves the @ alias for Shadcn
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Polyfill global for libraries like 'siwe'
    'global': 'window',
  },
  optimizeDeps: {
    // Force vite to pre-bundle these dependencies
    include: ['siwe', 'buffer', 'ethers'] 
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true, // Helps with mixed module types
    },
  }
})
