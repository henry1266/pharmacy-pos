import { createDashboardContractClientWithAuth } from '@/features/dashboard/api/client'
import type { ApiResponse } from '@pharmacy-pos/shared/types/api'

const dashboardClient = createDashboardContractClientWithAuth()

type SuccessEnvelope<T> = ApiResponse<T>

type DashboardContractResult = { status: number; body: unknown }

export interface LowStockWarning {
  productId: string
  productCode: string
  productName: string
  currentStock: number
  minStock: number
}

export interface TopProduct {
  productId?: string
  productCode: string
  productName: string
  quantity: number
  revenue: number
}

export interface RecentSale {
  id: string
  saleNumber?: string
  customerName: string
  totalAmount: number
  date: string | Date
  paymentStatus: string
}

export interface SalesSummary {
  total: number
  today: number
  month: number
}

export interface Counts {
  products: number
  customers: number
  suppliers: number
  orders: number
}

export interface DashboardSummary {
  salesSummary: SalesSummary
  counts: Counts
  lowStockWarnings: LowStockWarning[]
  topProducts: TopProduct[]
  recentSales: RecentSale[]
}

export interface SalesTrend {
  date: string
  totalSales: number
  count?: number
}

export interface CategorySales {
  category: string
  totalSales: number
}

const createError = (result: DashboardContractResult, fallback: string): Error => {
  const body = result.body as Record<string, unknown> | undefined
  const message =
    typeof body?.message === 'string'
      ? body.message
      : typeof body?.msg === 'string'
        ? body.msg
        : fallback
  const error = new Error(message)
  ;(error as any).status = result.status
  ;(error as any).body = result.body
  return error
}

const unwrapResponse = <T>(
  result: DashboardContractResult,
  fallback: string,
  defaultValue?: T,
): T => {
  const { status, body } = result

  if (status < 200 || status >= 300) {
    throw createError(result, fallback)
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as SuccessEnvelope<T>
    if (!envelope.success) {
      throw createError(result, fallback)
    }
    return envelope.data ?? (defaultValue as T)
  }

  if (body !== undefined && body !== null) {
    return body as T
  }

  if (defaultValue !== undefined) {
    return defaultValue
  }

  throw createError(result, fallback)
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const result = await dashboardClient.getDashboardSummary()
  return unwrapResponse<DashboardSummary>(result, 'Failed to fetch dashboard summary')
}

export const getProcessedSalesDataForDashboard = async (): Promise<{
  salesTrend: SalesTrend[]
  categorySales: CategorySales[]
}> => {
  const result = await dashboardClient.getSalesTrend()
  const data = unwrapResponse<{ salesTrend: Array<{ date: string; amount: number; count: number }>; categorySales: Array<{ category: string; amount: number }> }>(
    result,
    'Failed to fetch sales trend',
    { salesTrend: [], categorySales: [] },
  )

  const salesTrend: SalesTrend[] = data.salesTrend.map((entry) => ({
    date: entry.date,
    totalSales: entry.amount,
    count: entry.count,
  }))

  const categorySales: CategorySales[] = data.categorySales.map((entry) => ({
    category: entry.category,
    totalSales: entry.amount,
  }))

  return { salesTrend, categorySales }
}

const dashboardService = {
  getDashboardSummary,
  getProcessedSalesDataForDashboard,
}

export default dashboardService
