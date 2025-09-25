import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StockAPI, RawMaterial } from '../services/api'
import { ErrorHandler } from '../utils/errorHandler'

// Query keys for consistent caching
export const stockQueryKeys = {
  all: ['stock'] as const,
  materials: () => [...stockQueryKeys.all, 'materials'] as const,
  material: (id: string) => [...stockQueryKeys.all, 'materials', id] as const,
  lowStock: () => [...stockQueryKeys.all, 'low-stock'] as const,
  movements: (materialId: string) => [...stockQueryKeys.all, 'movements', materialId] as const,
}

export function useRawMaterials() {
  return useQuery({
    queryKey: stockQueryKeys.materials(),
    queryFn: StockAPI.getRawMaterials,
    staleTime: 2 * 60 * 1000, // 2 minutes - stock data can be stale for a bit
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
    refetchIntervalInBackground: false,
  })
}

export function useLowStockMaterials() {
  return useQuery({
    queryKey: stockQueryKeys.lowStock(),
    queryFn: StockAPI.getLowStockMaterials,
    staleTime: 30 * 1000, // 30 seconds - low stock should be fresh
    refetchInterval: 10 * 1000, // Check every 10 seconds for critical updates
  })
}

export function useStockMovements(materialId: string) {
  return useQuery({
    queryKey: stockQueryKeys.movements(materialId),
    queryFn: () => StockAPI.getStockMovements(materialId),
    enabled: !!materialId,
    staleTime: 60 * 1000, // 1 minute for movement history
  })
}

export function useUpdateStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ materialId, quantity, reason }: {
      materialId: string
      quantity: number
      reason?: string
    }) => StockAPI.updateStock(materialId, quantity, reason),
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.materials() })
      queryClient.invalidateQueries({ queryKey: stockQueryKeys.lowStock() })
    },
    onError: (error) => {
      ErrorHandler.handle(error, 'useUpdateStock')
    },
  })
}

export function useSuppliers() {
  return useQuery({
    queryKey: [...stockQueryKeys.all, 'suppliers'],
    queryFn: StockAPI.getSuppliers,
    staleTime: 5 * 60 * 1000, // 5 minutes - suppliers don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  })
}

export function useMaterialById(id: string) {
  return useQuery({
    queryKey: stockQueryKeys.material(id),
    queryFn: async (): Promise<RawMaterial | null> => {
      const materials = await StockAPI.getRawMaterials()
      return materials.find(m => m.id === id) || null
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual material
  })
}
