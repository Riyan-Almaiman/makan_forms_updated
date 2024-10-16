import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import removeConsole from 'vite-plugin-remove-console'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  
  return {
  
    plugins: [
      react(),
      isProduction && removeConsole()
    ].filter(Boolean),
    define: {
      'process.env.API_URL': JSON.stringify(isProduction ? '' : 'http://localhost')
    }
  }
})