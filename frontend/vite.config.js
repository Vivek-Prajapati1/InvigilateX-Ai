import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    include: [
      'formik',
      'yup',
      '@monaco-editor/react',
      'lodash',
      'react-helmet',
      'sweetalert',
      '@tabler/icons-react',
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled'
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  assetsInclude: ['**/*.svg'],
  server: {
    port: 5173,
    // Proxy disabled - using direct backend URL from .env (VITE_BACKEND_API_URL)
    // Uncomment below for local backend development:
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5001',
    //     changeOrigin: true,
    //   },
    // },
  },
}); 