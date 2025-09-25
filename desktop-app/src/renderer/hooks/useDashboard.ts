import { useQuery } from '@tanstack/react-query'
import { DashboardAPI } from '../services/api'
import { ErrorHandler } from '../utils/errorHandler'

// Query keys
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
}

export interface DashboardStats {
  totalMaterials: number
  lowStockCount: number
  criticalStockCount: number
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  totalRevenue: number
  monthlyRevenue: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: DashboardAPI.getDashboardStats,
    staleTime: 60 * 1000, // 1 minute - dashboard stats can be a bit stale
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchIntervalInBackground: false,
    retry: (failureCount, error: any) => {
      // Don't retry on client errors
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }
      return failureCount < 2
    },
  })
}

// Derived queries for specific dashboard metrics
export function useStockMetrics() {
  const { data: stats, ...queryInfo } = useDashboardStats()

  return {
    ...queryInfo,
    data: stats ? {
      totalMaterials: stats.totalMaterials,
      lowStockCount: stats.lowStockCount,
      criticalStockCount: stats.criticalStockCount,
      lowStockPercentage: stats.totalMaterials > 0
        ? Math.round((stats.lowStockCount / stats.totalMaterials) * 100)
        : 0,
      criticalStockPercentage: stats.totalMaterials > 0
        ? Math.round((stats.criticalStockCount / stats.totalMaterials) * 100)
        : 0,
    } : undefined,
  }
}

export function useOrderMetrics() {
  const { data: stats, ...queryInfo } = useDashboardStats()

  return {
    ...queryInfo,
    data: stats ? {
      totalOrders: stats.totalOrders,
      pendingOrders: stats.pendingOrders,
      confirmedOrders: stats.confirmedOrders,
      completionRate: stats.totalOrders > 0
        ? Math.round(((stats.totalOrders - stats.pendingOrders) / stats.totalOrders) * 100)
        : 100,
      ordersInProgress: stats.confirmedOrders,
    } : undefined,
  }
}

export function useRevenueMetrics() {
  const { data: stats, ...queryInfo } = useDashboardStats()

  return {
    ...queryInfo,
    data: stats ? {
      totalRevenue: stats.totalRevenue,
      monthlyRevenue: stats.monthlyRevenue,
      averageOrderValue: stats.totalOrders > 0
        ? stats.totalRevenue / stats.totalOrders
        : 0,
      monthlyGrowth: 0, // This would need historical data
    } : undefined,
  }
}

export function useDashboardAlerts() {
  const { data: stats, ...queryInfo } = useDashboardStats()

  return {
    ...queryInfo,
    data: stats ? {
      criticalStock: stats.criticalStockCount > 0,
      lowStock: stats.lowStockCount > 0,
      pendingOrders: stats.pendingOrders > 0,
      alerts: [
        ...(stats.criticalStockCount > 0 ? [{
          type: 'critical' as const,
          message: `${stats.criticalStockCount} malzeme kritik stok seviyesinde`,
          action: 'Stoka bak'
        }] : []),
        ...(stats.lowStockCount > 0 ? [{
          type: 'warning' as const,
          message: `${stats.lowStockCount} malzeme düşük stok seviyesinde`,
          action: 'Sipariş önerilerini incele'
        }] : []),
        ...(stats.pendingOrders > 0 ? [{
          type: 'info' as const,
          message: `${stats.pendingOrders} bekleyen sipariş var`,
          action: 'Siparişlere bak'
        }] : []),
      ]
    } : undefined,
  }
}
