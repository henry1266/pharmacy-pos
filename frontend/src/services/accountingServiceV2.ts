
import { format } from 'date-fns'
import { createAccountingContractClientWithAuth } from '@/features/daily-journal/api/client'
import type {
  AccountingFilters,
  ExtendedAccountingRecord,
  UnaccountedSale,
  AccountingCategory,
} from '@pharmacy-pos/shared/types/accounting'
import type { AccountingRecord } from '@pharmacy-pos/shared/types/entities'

const accountingClient = createAccountingContractClientWithAuth()

type ListAccountingsArgs = Parameters<typeof accountingClient.listAccountings>[0]

type SuccessEnvelope<T> = {
  success: true
  message?: string
  data?: T
  timestamp?: string
}

const formatDateForApi = (date: Date | string | null | undefined): string | undefined => {
  if (!date) {
    return undefined
  }
  return format(new Date(date), 'yyyy-MM-dd')
}

const normalizeRecordInput = (record: Partial<AccountingRecord>): Record<string, unknown> => {
  const payload: Record<string, unknown> = { ...record }
  if (record.date) {
    payload.date = formatDateForApi(record.date)
  }
  return payload
}

const createContractError = (result: { status: number; body: unknown }, fallback: string): Error => {
  const body = result.body as Record<string, unknown> | undefined
  const message = typeof body?.message === 'string'
    ? body.message
    : typeof body?.msg === 'string'
      ? body.msg
      : fallback
  const error = new Error(message)
  ;(error as any).status = result.status
  ;(error as any).body = result.body
  return error
}

const unwrapResponse = <T>(result: { status: number; body: unknown }, fallback: string, defaultValue?: T): T => {
  const { status, body } = result
  if (status < 200 || status >= 300) {
    throw createContractError(result, fallback)
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as SuccessEnvelope<T>
    if (!envelope.success) {
      throw createContractError(result, fallback)
    }
    return (envelope.data ?? defaultValue) as T
  }

  if (body !== undefined && body !== null) {
    return body as T
  }

  if (defaultValue !== undefined) {
    return defaultValue
  }

  throw createContractError(result, fallback)
}

export const accountingServiceV2 = {
  async getAccountingRecords(filters: AccountingFilters = {}): Promise<ExtendedAccountingRecord[]> {
    const query: NonNullable<ListAccountingsArgs['query']> = {}
    const startDate = formatDateForApi(filters.startDate ?? null)
    const endDate = formatDateForApi(filters.endDate ?? null)

    if (startDate) {
      query.startDate = startDate
    }
    if (endDate) {
      query.endDate = endDate
    }
    if (filters.shift) {
      query.shift = filters.shift
    }
    if (filters.search && filters.search.trim()) {
      query.search = filters.search.trim()
    }

    const args: ListAccountingsArgs = {
      query: Object.keys(query).length > 0 ? query : undefined,
    }
    const result = await accountingClient.listAccountings(args)
    return unwrapResponse<ExtendedAccountingRecord[]>(result, 'Failed to fetch accounting records', [])
  },

  async createAccountingRecord(payload: Partial<AccountingRecord>): Promise<AccountingRecord> {
    const body = normalizeRecordInput(payload)
    const result = await accountingClient.createAccounting({ body: body as any })
    return unwrapResponse<AccountingRecord>(result, 'Failed to create accounting record')
  },

  async updateAccountingRecord(id: string, payload: Partial<AccountingRecord>): Promise<AccountingRecord> {
    const body = normalizeRecordInput(payload)
    const result = await accountingClient.updateAccounting({ params: { id }, body: body as any })
    return unwrapResponse<AccountingRecord>(result, 'Failed to update accounting record')
  },

  async deleteAccountingRecord(id: string): Promise<{ success: boolean; message?: string }> {
    const result = await accountingClient.deleteAccounting({ params: { id } })
    const body = unwrapResponse<{ success?: boolean; message?: string; msg?: string }>(
      result,
      'Failed to delete accounting record',
      {},
    )
    const message = body.message ?? body.msg
    return {
      success: body.success ?? true,
      ...(message ? { message } : {}),
    }
  },

  async getUnaccountedSales(date: string): Promise<UnaccountedSale[]> {
    const result = await accountingClient.getUnaccountedSales({ query: { date } })
    return unwrapResponse<UnaccountedSale[]>(result, 'Failed to fetch unaccounted sales', [])
  },

  async getAccountingCategories(): Promise<AccountingCategory[]> {
    const result = await accountingClient.listAccountingCategories()
    return unwrapResponse<AccountingCategory[]>(result, 'Failed to fetch accounting categories', [])
  },

  async addAccountingCategory(category: Partial<AccountingCategory>): Promise<AccountingCategory> {
    const result = await accountingClient.createAccountingCategory({ body: category as any })
    return unwrapResponse<AccountingCategory>(result, 'Failed to create accounting category')
  },

  async updateAccountingCategory(id: string, category: Partial<AccountingCategory>): Promise<AccountingCategory> {
    const result = await accountingClient.updateAccountingCategory({ params: { id }, body: category as any })
    return unwrapResponse<AccountingCategory>(result, 'Failed to update accounting category')
  },

  async deleteAccountingCategory(id: string): Promise<{ success: boolean; message?: string }> {
    const result = await accountingClient.deleteAccountingCategory({ params: { id } })
    const body = unwrapResponse<{ success?: boolean; message?: string; msg?: string }>(
      result,
      'Failed to delete accounting category',
      {},
    )
    const message = body.message ?? body.msg
    return {
      success: body.success ?? true,
      ...(message ? { message } : {}),
    }
  },
}

export default accountingServiceV2
