// Electron API types
declare global {
  interface Window {
    electronAPI: {
      showNotification: (options: {
        title: string
        body: string
        icon?: string
        urgency?: 'low' | 'normal' | 'critical'
      }) => Promise<{ success: boolean; error?: string }>
    }
    mdh: {
      ping: () => string
      env: {
        VITE_SUPABASE_URL: string
        VITE_SUPABASE_ANON_KEY: string
        VITE_ENVIRONMENT: string
      }
    }
  }
}

export {}
