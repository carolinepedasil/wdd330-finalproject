import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 5173
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.onrender.com',
      'wdd330-final-project-jcer.onrender.com'
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vite']
        }
      }
    }
  },
  appType: 'spa'
})