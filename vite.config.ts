import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative assets work when the site is published at any GitHub Pages subpath.
  base: './',
})
