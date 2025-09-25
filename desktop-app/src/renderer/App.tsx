import React, { useState, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ErrorHandler } from './utils/errorHandler'
import { ReactQueryProvider } from './providers/ReactQueryProvider'
import { Dashboard, StockManager, OrderManager, ReportsManager } from './components'
import ProductsManager from './components/ProductsManager'
import SemiFinishedManager from './components/SemiFinishedManager'
import SupplierManager from './SupplierManager'
import SettingsManager from './SettingsManager'
import SystemTest from './SystemTest'
import { notificationService } from './services/NotificationService'
import { NotificationIcon } from './components/NotificationIcon'

type ActiveView = 'dashboard' | 'stock' | 'orders' | 'suppliers' | 'products' | 'semi-finished' | 'reports' | 'settings' | 'test'

function AppContent() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [loading, setLoading] = useState(true)

  const navItems = [
    { id: 'dashboard' as const, name: 'Dashboard', icon: '📊' },
    { id: 'stock' as const, name: 'Stok Yönetimi', icon: '📦' },
    { id: 'orders' as const, name: 'Siparişler', icon: '📋' },
    { id: 'suppliers' as const, name: 'Tedarikçiler', icon: '🏪' },
    { id: 'products' as const, name: 'Ürünler', icon: '🛍️' },
    { id: 'semi-finished' as const, name: 'Yarı Mamuller', icon: '🔧' },
    { id: 'reports' as const, name: 'Raporlar', icon: '📈' },
    { id: 'settings' as const, name: 'Ayarlar', icon: '⚙️' },
    { id: 'test' as const, name: 'Sistem Testi', icon: '🧪' }
  ]

  // Online/offline status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial loading delay for better UX
    const timer = setTimeout(() => setLoading(false), 1000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimeout(timer)
    }
  }, [])

  // Notification service initialization - only check on app start
  useEffect(() => {
    // Check for notifications only when app starts
    notificationService.checkNotificationsOnStart()

    // No continuous polling - better for free plan
  }, [])

  // Global error handler
  const handleError = (error: Error, errorInfo: any) => {
    ErrorHandler.handle(error, 'App Component')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Uygulama yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary onError={handleError}>
      <div className="min-h-screen bg-gray-100">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-red-500 text-white px-4 py-2 text-center text-sm">
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              İnternet bağlantısı yok. Bazı özellikler çalışmayabilir.
            </span>
          </div>
        )}

        <header className="bg-white shadow-sm border-b">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 min-h-[60px]">
              {/* Sol Taraf - Logo ve Status */}
              <div className="flex items-center space-x-3 flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">Meri Design House</h1>
                <span className="hidden sm:inline text-sm text-gray-500">Desktop</span>
                <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                  isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </span>
              </div>
              
              {/* Orta - Navigasyon */}
              <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeView === item.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    <span className="hidden xl:inline">{item.name}</span>
                  </button>
                ))}
              </nav>
              
              {/* Sağ Taraf - Bildirim */}
              <div className="flex items-center flex-shrink-0">
                <NotificationIcon />
              </div>
            </div>
            
            {/* Mobil Navigasyon */}
            <div className="lg:hidden border-t border-gray-100">
              <nav className="flex items-center space-x-1 py-2 overflow-x-auto scrollbar-hide">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeView === item.id
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6">
          <ErrorBoundary>
            {activeView === 'dashboard' && <Dashboard />}
            {activeView === 'stock' && <StockManager onNavigate={setActiveView} />}
            {activeView === 'orders' && <OrderManager />}
            {activeView === 'suppliers' && <SupplierManager />}
            {activeView === 'products' && <ProductsManager />}
            {activeView === 'semi-finished' && <SemiFinishedManager />}
            {activeView === 'reports' && <ReportsManager />}
            {activeView === 'settings' && <SettingsManager />}
            {activeView === 'test' && <SystemTest />}
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ReactQueryProvider>
      <AppContent />
    </ReactQueryProvider>
  )
}