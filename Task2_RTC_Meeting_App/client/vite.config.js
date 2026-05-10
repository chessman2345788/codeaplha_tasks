import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    // We run on standard HTTP because modern browsers inherently trust 'localhost' 
    // as a Secure Context allowing camera access without needing to hack SSL certificates!
    port: 5173,
    strictPort: true
  }
});
