import { initServer } from '@ts-rest/express'
import { accountingContract } from '@pharmacy-pos/shared/api/contracts'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
import logger from '../../../../utils/logger'
import type { AuthenticatedRequest } from '../../../../src/types/express'
import {
  type AccountingRecordCreateInput,
  type AccountingRecordUpdateInput,
  type AccountingSearchInput,
  createAccounting,
  deleteAccounting,
  getUnaccountedSalesByDate,
  listAccountings,
  updateAccounting,
} from '../../services/accounting.service'
import {
  type AccountingCategoryCreateInput,
  type AccountingCategoryUpdateInput,
  createAccountingCategory,
  deleteAccountingCategory,
  listAccountingCategories,
  updateAccountingCategory,
} from '../../services/accountingCategory.service'

const server = initServer()

type KnownErrorStatus = 400 | 401 | 404 | 409 | 500

type SuccessPayload<T> = {
  success: true
  message: string
  data?: T
  timestamp: string
}

type ErrorPayload = {
  success: false
  message: string
  statusCode: KnownErrorStatus
  timestamp: string
  error?: string
}

function toPlain<T>(record: T): T {
  if (record && typeof (record as any)?.toObject === 'function') {
    return (record as any).toObject({ getters: true })
  }
  return record
}

function buildError(status: KnownErrorStatus, message: string, error?: unknown) {
  const payload: ErrorPayload = {
    success: false,
    message,
    statusCode: status,
    timestamp: new Date().toISOString(),
    ...(error instanceof Error ? { error: error.message } : {}),
  }
  return { status, body: payload } as const
}

const implementation: Record<string, any> = {
  listAccountings: async ({ query }: { query?: AccountingSearchInput }) => {
    try {
      const filters = query ?? {}
      const records = await listAccountings(filters)
      const body: SuccessPayload<unknown> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
        data: records.map((record: any) => toPlain(record)),
        timestamp: new Date().toISOString(),
      }
      return { status: 200, body } as const
    } catch (error) {
      logger.error(`Failed to list accounting records: ${error instanceof Error ? error.message : String(error)}`)
      return buildError(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR, error)
    }
  },
  createAccounting: async ({ body, req }: any) => {
    try {
      const payload = body as AccountingRecordCreateInput
      const authReq = req as AuthenticatedRequest | undefined
      const record = await createAccounting(payload, authReq?.user?.id)
      const responseBody: SuccessPayload<unknown> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.CREATED,
        data: toPlain(record),
        timestamp: new Date().toISOString(),
      }
      return { status: 200, body: responseBody } as const
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status as KnownErrorStatus | undefined
        if (status && status !== 500) {
          return buildError(status, error.message, error)
        }
      }
      logger.error(`Failed to create accounting record: ${error instanceof Error ? error.message : String(error)}`)
      return buildError(500, error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC.SERVER_ERROR, error)
    }
  },
  updateAccounting: async ({ params, body }: any) => {
    try {
      const payload = body as AccountingRecordUpdateInput
      const record = await updateAccounting(params.id, payload)
      const responseBody: SuccessPayload<unknown> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.UPDATED,
        data: toPlain(record),
        timestamp: new Date().toISOString(),
      }
      return { status: 200, body: responseBody } as const
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status as KnownErrorStatus | undefined
        if (status && status !== 500) {
          return buildError(status, error.message, error)
        }
      }
      logger.error(`Failed to update accounting record: ${error instanceof Error ? error.message : String(error)}`)
      return buildError(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR, error)
    }
  },
  deleteAccounting: async ({ params }: any) => {
    try {
      const result = await deleteAccounting(params.id)
      const responseBody: SuccessPayload<unknown> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.DELETED,
        data: result,
        timestamp: new Date().toISOString(),
      }
      return { status: 200, body: responseBody } as const
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status as KnownErrorStatus | undefined
        if (status && status !== 500) {
          return buildError(status, error.message, error)
        }
      }
      logger.error(`Failed to delete accounting record: ${error instanceof Error ? error.message : String(error)}`)
      return buildError(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR, error)
    }
  },
  getUnaccountedSales: async ({ query }: any) => {
    try {
      const date = (query?.date ?? '') as string
      const sales = await getUnaccountedSalesByDate(date)
      const body: SuccessPayload<unknown> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
        data: sales,
        timestamp: new Date().toISOString(),
      }
      return { status: 200, body } as const
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status as KnownErrorStatus | undefined
        if (status && status !== 500) {
          return buildError(status, error.message, error)
        }
      }
      logger.error(`Failed to list unaccounted sales: ${error instanceof Error ? error.message : String(error)}`)
      return buildError(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR, error)
    }
  },
  listAccountingCategories: async () => {
    try {
      const categories = await listAccountingCategories()
      const body: SuccessPayload<unknown> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
        data: categories.map((category: any) => toPlain(category)),
        timestamp: new Date().toISOString(),
      }
      return { status: 200, body } as const
    } catch (error) {
      logger.error(`Failed to list accounting categories: ${error instanceof Error ? error.message : String(error)}`)
      return buildError(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR, error)
    }
  },
  createAccountingCategory: async ({ body }: any) => {
    try {
      const payload = body as AccountingCategoryCreateInput
      const category = await createAccountingCategory(payload)
      const responseBody: SuccessPayload<unknown> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.CREATED,
        data: toPlain(category),
        timestamp: new Date().toISOString(),
      }
      return { status: 200, body: responseBody } as const
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status as KnownErrorStatus | undefined
        if (status && status !== 500) {
          return buildError(status, error.message, error)
        }
      }
      logger.error(`Failed to create accounting category: ${error instanceof Error ? error.message : String(error)}`)
      return buildError(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR, error)
    }
  },
  updateAccountingCategory: async ({ params, body }: any) => {
    try {
      const payload = body as AccountingCategoryUpdateInput
      const category = await updateAccountingCategory(params.id, payload)
      const responseBody: SuccessPayload<unknown> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.UPDATED,
        data: toPlain(category),
        timestamp: new Date().toISOString(),
      }
      return { status: 200, body: responseBody } as const
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status as KnownErrorStatus | undefined
        if (status && status !== 500) {
          return buildError(status, error.message, error)
        }
      }
      logger.error(`Failed to update accounting category: ${error instanceof Error ? error.message : String(error)}`)
      return buildError(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR, error)
    }
  },
  deleteAccountingCategory: async ({ params }: any) => {
    try {
      const result = await deleteAccountingCategory(params.id)
      const responseBody: SuccessPayload<unknown> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.DELETED,
        data: result,
        timestamp: new Date().toISOString(),
      }
      return { status: 200, body: responseBody } as const
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status as KnownErrorStatus | undefined
        if (status && status !== 500) {
          return buildError(status, error.message, error)
        }
      }
      logger.error(`Failed to delete accounting category: ${error instanceof Error ? error.message : String(error)}`)
      return buildError(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR, error)
    }
  },
}

export const accountingController = server.router(accountingContract, implementation as any) as any
