import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    // Allows the hosting provider to override the port if needed
    port: parseInt(process.env.PORT || '5173')
  }
});