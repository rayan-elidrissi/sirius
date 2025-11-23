export interface User {
  id: string
  name: string
  email: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// Export des types blob
export * from './blob'

