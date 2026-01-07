import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL: base: './' ensures assets are loaded relatively,
  // making it compatible with GitHub Pages subpaths.
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})