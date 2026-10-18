import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { assertPublicSupabaseConfig } from './src/lib/publicConfig.js';

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    assertPublicSupabaseConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  }
  return {
  base: '/PIPE/',
  plugins: [react()],
  server: {
    port: 5173
  }
  };
});
