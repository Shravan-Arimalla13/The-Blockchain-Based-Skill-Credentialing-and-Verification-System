import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import jsconfigPaths from 'vite-jsconfig-paths'

export default defineConfig({
  plugins: [react(), jsconfigPaths(),tailwindcss()],
  base: '/', // <--- ADD THIS: Ensures assets load correctly with HashRouter
  server: {
    host: true,
    port: 5173
  },
  resolve: {
    alias: {
      // This forces the browser-compatible version of buffer
      buffer: 'buffer/',
      // Helps resolve path issues
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Polyfill global for some older libraries
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

