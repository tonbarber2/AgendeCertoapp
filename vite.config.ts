import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Garante que as variáveis de ambiente funcionem no código do navegador após o build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});