import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ErrorHandler } from '../utils/errorHandler'
import { APP_CONFIG, THEMES, UI_CONFIG } from '../constants'

// App Settings Interface
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'tr' | 'en'
  notifications: {
    enabled: boolean
    sound: boolean
    desktop: boolean
  }
  autoBackup: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    lastBackup: string | null
  }
  connection: {
    autoReconnect: boolean
    retryAttempts: number
    retryDelay: number
  }
}

// User Preferences Interface
export interface UserPreferences {
  dashboard: {
    defaultView: string
    refreshInterval: number
    showAlerts: boolean
    compactMode: boolean
  }
  table: {
    pageSize: number
    showFilters: boolean
    rememberSorting: boolean
  }
  stock: {
    lowStockThreshold: number
    criticalStockThreshold: number
    autoReorderEnabled: boolean
  }
  orders: {
    autoRefresh: boolean
    confirmOnStatusChange: boolean
    defaultStatusFilter: string
  }
}

// Global App State Interface
export interface AppState {
  // Settings
  settings: AppSettings
  preferences: UserPreferences

  // UI State
  sidebarOpen: boolean
  activeModal: string | null
  loadingStates: Record<string, boolean>
  alerts: AppAlert[]

  // Connection State
  isOnline: boolean
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error'

  // App Lifecycle
  isInitialized: boolean
  version: string

  // Actions
  setTheme: (theme: AppSettings['theme']) => void
  setLanguage: (language: AppSettings['language']) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  updatePreferences: (updates: Partial<UserPreferences>) => void
  toggleSidebar: () => void
  setActiveModal: (modal: string | null) => void
  setLoadingState: (key: string, loading: boolean) => void
  addAlert: (alert: Omit<AppAlert, 'id' | 'timestamp'>) => void
  removeAlert: (id: string) => void
  clearAlerts: () => void
  setConnectionStatus: (status: AppState['connectionStatus']) => void
  setOnlineStatus: (isOnline: boolean) => void
  initializeApp: () => Promise<void>
  resetApp: () => void
}

// Alert Interface
export interface AppAlert {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  action?: {
    label: string
    handler: () => void
  }
  autoClose?: boolean
  duration?: number
}

// Default Settings
const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'tr',
  notifications: {
    enabled: true,
    sound: true,
    desktop: false
  },
  autoBackup: {
    enabled: false,
    frequency: 'weekly',
    time: '02:00',
    lastBackup: null
  },
  connection: {
    autoReconnect: true,
    retryAttempts: 3,
    retryDelay: 5000
  }
}

// Default Preferences
const defaultPreferences: UserPreferences = {
  dashboard: {
    defaultView: 'overview',
    refreshInterval: 30000,
    showAlerts: true,
    compactMode: false
  },
  table: {
    pageSize: 20,
    showFilters: true,
    rememberSorting: true
  },
  stock: {
    lowStockThreshold: 120,
    criticalStockThreshold: 100,
    autoReorderEnabled: false
  },
  orders: {
    autoRefresh: true,
    confirmOnStatusChange: true,
    defaultStatusFilter: 'all'
  }
}

// Create the store
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      settings: defaultSettings,
      preferences: defaultPreferences,
      sidebarOpen: true,
      activeModal: null,
      loadingStates: {},
      alerts: [],
      isOnline: navigator.onLine,
      connectionStatus: 'connected',
      isInitialized: false,
      version: APP_CONFIG.VERSION,

      // Settings Actions
      setTheme: (theme) => {
        try {
          set((state) => ({
            settings: { ...state.settings, theme }
          }))

          // Apply theme to document
          const root = document.documentElement
          if (theme === 'dark') {
            root.classList.add('dark')
          } else if (theme === 'light') {
            root.classList.remove('dark')
          } else {
            // System theme - check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            if (prefersDark) {
              root.classList.add('dark')
            } else {
              root.classList.remove('dark')
            }
          }
        } catch (error) {
          ErrorHandler.handle(error, 'useAppStore.setTheme')
        }
      },

      setLanguage: (language) => {
        set((state) => ({
          settings: { ...state.settings, language }
        }))
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }))
      },

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates }
        }))
      },

      // UI Actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }))
      },

      setActiveModal: (modal) => {
        set({ activeModal: modal })
      },

      setLoadingState: (key, loading) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading
          }
        }))
      },

      // Alert Actions
      addAlert: (alertData) => {
        const alert: AppAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          ...alertData
        }

        set((state) => ({
          alerts: [...state.alerts, alert]
        }))

        // Auto close if specified
        if (alert.autoClose && alert.duration) {
          setTimeout(() => {
            get().removeAlert(alert.id)
          }, alert.duration)
        }

        // Show desktop notification if enabled
        if (get().settings.notifications.desktop && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(alert.title, {
              body: alert.message,
              icon: '/favicon.ico'
            })
          }
        }
      },

      removeAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.filter(alert => alert.id !== id)
        }))
      },

      clearAlerts: () => {
        set({ alerts: [] })
      },

      // Connection Actions
      setConnectionStatus: (status) => {
        set({ connectionStatus: status })
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline })

        // Show alert for status change
        const alertType: AppAlert['type'] = isOnline ? 'success' : 'warning'
        const title = isOnline ? 'Bağlantı Geri Geldi' : 'Bağlantı Kesildi'
        const message = isOnline
          ? 'İnternet bağlantınız geri geldi.'
          : 'İnternet bağlantınız kesildi. Bazı özellikler çalışmayabilir.'

        get().addAlert({
          type: alertType,
          title,
          message,
          autoClose: true,
          duration: 5000
        })
      },

      // Lifecycle Actions
      initializeApp: async () => {
        try {
          // Check system theme preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (get().settings.theme === 'system') {
            get().setTheme('system')
          }

          // Set up online/offline listeners
          window.addEventListener('online', () => get().setOnlineStatus(true))
          window.addEventListener('offline', () => get().setOnlineStatus(false))

          // Check initial connection
          get().setOnlineStatus(navigator.onLine)

          // Set up periodic health check
          setInterval(() => {
            // This would check API health
            // For now, just check online status
            get().setOnlineStatus(navigator.onLine)
          }, 30000)

          set({ isInitialized: true })

          get().addAlert({
            type: 'success',
            title: 'Uygulama Başlatıldı',
            message: 'Meri Design House Desktop başarıyla başlatıldı.',
            autoClose: true,
            duration: 3000
          })
        } catch (error) {
          ErrorHandler.handle(error, 'useAppStore.initializeApp')
          throw error
        }
      },

      resetApp: () => {
        // Clear all persisted state
        localStorage.removeItem('app-store')

        // Reset to defaults
        set({
          settings: defaultSettings,
          preferences: defaultPreferences,
          sidebarOpen: true,
          activeModal: null,
          loadingStates: {},
          alerts: [],
          isOnline: navigator.onLine,
          connectionStatus: 'connected',
          isInitialized: false
        })

        // Reinitialize
        setTimeout(() => get().initializeApp(), 100)
      }
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        preferences: state.preferences,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
)

// Helper hooks for common operations
export const useTheme = () => {
  const theme = useAppStore((state) => state.settings.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  return { theme, setTheme }
}

export const useConnectionStatus = () => {
  const isOnline = useAppStore((state) => state.isOnline)
  const connectionStatus = useAppStore((state) => state.connectionStatus)
  const setConnectionStatus = useAppStore((state) => state.setConnectionStatus)

  return { isOnline, connectionStatus, setConnectionStatus }
}

export const useAlerts = () => {
  const alerts = useAppStore((state) => state.alerts)
  const addAlert = useAppStore((state) => state.addAlert)
  const removeAlert = useAppStore((state) => state.removeAlert)
  const clearAlerts = useAppStore((state) => state.clearAlerts)

  return { alerts, addAlert, removeAlert, clearAlerts }
}

export const useLoadingStates = () => {
  const loadingStates = useAppStore((state) => state.loadingStates)
  const setLoadingState = useAppStore((state) => state.setLoadingState)

  return { loadingStates, setLoadingState }
}

// System theme listener
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  mediaQuery.addEventListener('change', (e) => {
    const appTheme = useAppStore.getState().settings.theme
    if (appTheme === 'system') {
      useAppStore.getState().setTheme('system')
    }
  })
}
