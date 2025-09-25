import React, { useState, useEffect, useRef } from 'react'
import { notificationService } from '../services/NotificationService'

interface NotificationIconProps {
  className?: string
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Bildirimleri yükle
  useEffect(() => {
    const loadNotifications = () => {
      const notifs = notificationService.getNotifications()
      const count = notificationService.getUnreadCount()
      setNotifications(notifs)
      setUnreadCount(count)
    }

    loadNotifications()
  }, [])

  // Dropdown dışına tıklama kontrolü
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Bildirimi okundu olarak işaretle
  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId)
    
    // Local state'i güncelle
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    setUnreadCount(prev => prev - 1)
  }

  // Tüm bildirimleri okundu olarak işaretle
  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead()
    setNotifications([])
    setUnreadCount(0)
  }

  // Bildirim ikonu
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'stock_insufficient':
        return '⚠️'
      case 'order_update':
        return '📋'
      case 'system_alert':
        return '🚨'
      default:
        return 'ℹ️'
    }
  }

  // Bildirim rengi
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'stock_insufficient':
        return 'text-red-600 bg-red-50'
      case 'order_update':
        return 'text-blue-600 bg-blue-50'
      case 'system_alert':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bildirim İkonu */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="
          relative p-1.5 rounded-lg
          bg-white/80 backdrop-blur-sm
          border border-gray-200/50
          shadow-sm
          transition-all duration-200
          hover:bg-white/90 hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-blue-500/20
        "
        title="Bildirimler"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Rozet */}
        {unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1
            min-w-[18px] h-[18px]
            bg-red-500 text-white
            text-xs font-medium
            rounded-full
            flex items-center justify-center
            shadow-sm
          ">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="
          absolute top-full right-0 mt-2
          w-80 max-h-96
          bg-white/95 backdrop-blur-xl
          border border-gray-200/50
          rounded-xl shadow-lg
          overflow-hidden
          z-50
        ">
          {/* Header */}
          <div className="
            px-4 py-3
            bg-gradient-to-r from-blue-50 to-indigo-50
            border-b border-gray-200/50
            flex items-center justify-between
          ">
            <h3 className="text-sm font-semibold text-gray-900">
              Bildirimler
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="
                  text-xs text-blue-600
                  hover:text-blue-700
                  font-medium
                  transition-colors duration-200
                "
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* Bildirimler Listesi */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="
                px-4 py-8
                text-center text-gray-500
                text-sm
              ">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>Yeni bildirim yok</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="
                    px-4 py-3
                    border-b border-gray-100/50
                    transition-colors duration-200
                    hover:bg-gray-50/50
                  "
                >
                  <div className="flex items-start space-x-3">
                    {/* İkon */}
                    <div className={`
                      flex-shrink-0 w-8 h-8
                      rounded-full
                      flex items-center justify-center
                      text-sm
                      ${getNotificationColor(notification.type)}
                    `}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString('tr-TR')}
                        </span>
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="
                            text-xs text-gray-400
                            hover:text-gray-600
                            transition-colors duration-200
                          "
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
