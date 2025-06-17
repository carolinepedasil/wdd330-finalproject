import { defineConfig } from 'vite';

export default defineConfig({
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173,
    allowedHosts: ['wdd330-finalproject-doqj.onrender.com'],
  },
});
