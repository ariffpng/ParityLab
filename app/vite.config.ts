/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' keeps every asset path relative, so dist/ works from any static
// host or subfolder (and from a USB stick for an offline demo).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split the two large libraries out of the app chunk (better caching, no size warning).
        manualChunks: {
          react: ['react', 'react-dom'],
          katex: ['katex'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
