export const config = {
  app: {
    name: 'Front Walrus',
    version: '1.0.0',
  },
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    timeout: 10000,
  },
} as const

