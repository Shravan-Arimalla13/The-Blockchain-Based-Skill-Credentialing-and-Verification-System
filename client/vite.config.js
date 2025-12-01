import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from 'vite-jsconfig-paths'

export default defineConfig({
  plugins: [react(), jsconfigPaths()],
  base: './', // <--- ADD THIS: Ensures assets load correctly with HashRouter
  server: {
    host: true,
    port: 5173
  }
})