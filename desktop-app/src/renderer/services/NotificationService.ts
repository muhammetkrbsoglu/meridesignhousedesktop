import { supabase } from '../SupabaseClient'

export interface Notification {
  id: string
  type: 'stock_insufficient' | 'order_update' | 'system_alert'
  title: string
  message: string
  data?: any
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_read: boolean
  created_at: string
  read_at?: string
}

export class NotificationService {
  private static instance: NotificationService
  private notifications: Notification[] = []
  private unreadCount: number = 0

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Uygulama başlangıcında bildirimleri kontrol et
  public async checkNotificationsOnStart(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      this.notifications = data || []
      this.unreadCount = this.notifications.length

      // Yeni bildirimler varsa göster
      if (this.unreadCount > 0) {
        console.log(`🔔 Found ${this.unreadCount} unread notifications`)
      }
    } catch (error) {
      console.error('Error checking notifications on start:', error)
    }
  }

  // Bildirimleri al
  public getNotifications(): Notification[] {
    return this.notifications
  }

  // Okunmamış sayısını al
  public getUnreadCount(): number {
    return this.unreadCount
  }

  // Bildirimleri işaretle
  public async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)

      // Local state'i güncelle
      this.notifications = this.notifications.filter(n => n.id !== notificationId)
      this.unreadCount = this.notifications.length
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Tüm bildirimleri işaretle
  public async markAllAsRead(): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('is_read', false)

      // Local state'i temizle
      this.notifications = []
      this.unreadCount = 0
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }


  // Bildirim ikonu
  private getNotificationIcon(type: string): string {
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

  // Priority mapping
  private mapPriorityToUrgency(priority: string): 'low' | 'normal' | 'critical' {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'critical'
      case 'normal':
        return 'normal'
      case 'low':
        return 'low'
      default:
        return 'normal'
    }
  }

  // Stok yetersizliği bildirimi oluştur
  public async createStockInsufficientNotification(orderNumber: string, insufficientItems: any[]): Promise<void> {
    try {
      const message = `Sipariş ${orderNumber} için ${insufficientItems.length} malzeme yetersiz`
      
      await supabase
        .from('notifications')
        .insert({
          type: 'stock_insufficient',
          title: 'Stok Yetersizliği',
          message,
          data: {
            order_number: orderNumber,
            insufficient_items: insufficientItems
          },
          priority: 'high'
        })
    } catch (error) {
      console.error('Error creating stock insufficient notification:', error)
    }
  }
}

export const notificationService = NotificationService.getInstance()
