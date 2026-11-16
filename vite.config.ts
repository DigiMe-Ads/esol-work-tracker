import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port: 5178,
      // Same /supabase proxy as vercel.json, so local dev uses the production network path.
      proxy: {
        '/supabase': {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/supabase/, ''),
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'], supabase: ['@supabase/supabase-js'] },
        },
      },
    },
  };
});
