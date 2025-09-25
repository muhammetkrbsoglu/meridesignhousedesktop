import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OrderAPI, Order, OrderItem } from '../services/api'
import { ErrorHandler } from '../utils/errorHandler'

// Query keys
export const orderQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...orderQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...orderQueryKeys.lists(), filters] as const,
  details: () => [...orderQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderQueryKeys.details(), id] as const,
}

export function useOrders(filters?: Record<string, any>) {
  return useQuery({
    queryKey: orderQueryKeys.list(filters || {}),
    queryFn: OrderAPI.getOrders,
    staleTime: 30 * 1000, // 30 seconds - orders should be relatively fresh
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    refetchIntervalInBackground: false,
  })
}

export function useOrderById(orderId: string) {
  return useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => OrderAPI.getOrderById(orderId),
    enabled: !!orderId,
    staleTime: 60 * 1000, // 1 minute for order details
    retry: (failureCount, error: any) => {
      // Don't retry if order not found (404)
      if (error?.status === 404) {
        return false
      }
      return failureCount < 2
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, status, notes }: {
      orderId: string
      status: string
      notes?: string
    }) => OrderAPI.updateOrderStatus(orderId, status as any, notes),
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.lists() })
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.detail(orderId) })

      // Snapshot previous values
      const previousOrders = queryClient.getQueryData(orderQueryKeys.lists())
      const previousOrder = queryClient.getQueryData(orderQueryKeys.detail(orderId))

      // Optimistically update orders list
      queryClient.setQueryData(orderQueryKeys.lists(), (old: Order[] | undefined) => {
        if (!old) return old
        return old.map(order =>
          order.id === orderId
            ? { ...order, status, updatedAt: new Date().toISOString() }
            : order
        )
      })

      // Optimistically update order detail
      queryClient.setQueryData(orderQueryKeys.detail(orderId), (old: Order | undefined) => {
        if (!old) return old
        return { ...old, status, updatedAt: new Date().toISOString() }
      })

      return { previousOrders, previousOrder }
    },
    onError: (error, variables, context) => {
      // Revert optimistic updates on error
      if (context?.previousOrders) {
        queryClient.setQueryData(orderQueryKeys.lists(), context.previousOrders)
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(orderQueryKeys.detail(variables.orderId), context.previousOrder)
      }

      ErrorHandler.handle(error, 'useUpdateOrderStatus')
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(variables.orderId) })

      // Also invalidate stock queries since stock might have changed
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}

export function usePendingOrdersCount() {
  return useQuery({
    queryKey: [...orderQueryKeys.lists(), 'pending-count'],
    queryFn: async () => {
      const orders = await OrderAPI.getOrders()
      return orders.filter(order => order.status === 'PENDING').length
    },
    staleTime: 10 * 1000, // 10 seconds for count
    refetchInterval: 5 * 1000, // Update every 5 seconds
  })
}

export function useOrderStats() {
  return useQuery({
    queryKey: [...orderQueryKeys.all, 'stats'],
    queryFn: async () => {
      const orders = await OrderAPI.getOrders()

      const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
        processing: orders.filter(o => o.status === 'PROCESSING').length,
        shipped: orders.filter(o => o.status === 'SHIPPED').length,
        delivered: orders.filter(o => o.status === 'DELIVERED').length,
        cancelled: orders.filter(o => o.status === 'CANCELLED').length,
        refunded: orders.filter(o => o.status === 'REFUNDED').length,
        totalRevenue: orders
          .filter(o => ['CONFIRMED', 'DELIVERED'].includes(o.status))
          .reduce((sum, order) => sum + order.totalAmount, 0),
      }

      return stats
    },
    staleTime: 30 * 1000, // 30 seconds for stats
    refetchInterval: 15 * 1000, // Update every 15 seconds
  })
}
