import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    proxy: {
      // Proxying API requests to backend server running on port 5000
      // Adjust the '/api' prefix if your frontend uses a different path for API calls
      '/api': { 
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false, // Set to true if backend uses HTTPS with valid cert
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment and adjust if the backend doesn't expect the '/api' prefix
      }
    }
  }
})

