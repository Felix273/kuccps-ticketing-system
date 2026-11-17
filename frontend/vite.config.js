import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL

  if (command === 'build' && mode === 'production') {
    const isRelativeApiUrl = apiUrl?.startsWith('/') && !apiUrl.startsWith('//') && !/[?#]/.test(apiUrl)
    let isHttpsApiUrl = false
    try {
      const parsedApiUrl = new URL(apiUrl)
      isHttpsApiUrl = parsedApiUrl.protocol === 'https:' &&
        !parsedApiUrl.username &&
        !parsedApiUrl.password &&
        !parsedApiUrl.search &&
        !parsedApiUrl.hash
    } catch {
      isHttpsApiUrl = false
    }

    if (!isRelativeApiUrl && !isHttpsApiUrl) {
      throw new Error('Production builds require VITE_API_URL to be an HTTPS URL or a same-origin path such as /api.')
    }
  }

  return {
    plugins: [react()],
    optimizeDeps: false
  }
})
