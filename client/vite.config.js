import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Any request to /api/... is forwarded to our Express server
    proxy: { '/api': 'http://localhost:4000' },
  },
});