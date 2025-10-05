import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import {
  accountingRecordSchema,
  accountingRecordCreateSchema,
  accountingRecordUpdateSchema,
  accountingSearchSchema,
  accountingCategorySchema,
  accountingCategoryCreateSchema,
  accountingCategoryUpdateSchema,
  unaccountedSaleSchema,
} from '../../schemas/zod/accounting'
import {
  apiErrorResponseSchema,
  createApiResponseSchema,
} from '../../schemas/zod/common'
import { zodId } from '../../utils/zodUtils'

const c = initContract()

const accountingRecordResponseSchema = createApiResponseSchema(accountingRecordSchema).or(accountingRecordSchema)
const accountingRecordListResponseSchema = createApiResponseSchema(z.array(accountingRecordSchema)).or(z.array(accountingRecordSchema))
const accountingDeleteResponseSchema = createApiResponseSchema(z.object({ id: zodId }).partial()).or(
  z.object({ msg: z.string().optional() }).passthrough(),
)
const unaccountedSalesResponseSchema = createApiResponseSchema(z.array(unaccountedSaleSchema)).or(z.array(unaccountedSaleSchema))
const accountingCategoryListResponseSchema = createApiResponseSchema(z.array(accountingCategorySchema)).or(z.array(accountingCategorySchema))
const accountingCategoryResponseSchema = createApiResponseSchema(accountingCategorySchema).or(accountingCategorySchema)

export const accountingContract = c.router({
  listAccountings: {
    method: 'GET',
    path: '/accounting',
    query: accountingSearchSchema.optional(),
    responses: {
      200: accountingRecordListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List accounting records',
      tags: ['Accounting'],
    },
  },
  createAccounting: {
    method: 'POST',
    path: '/accounting',
    body: accountingRecordCreateSchema,
    responses: {
      200: accountingRecordResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create accounting record',
      tags: ['Accounting'],
    },
  },
  updateAccounting: {
    method: 'PUT',
    path: '/accounting/:id',
    pathParams: z.object({ id: zodId }),
    body: accountingRecordUpdateSchema,
    responses: {
      200: accountingRecordResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update accounting record',
      tags: ['Accounting'],
    },
  },
  deleteAccounting: {
    method: 'DELETE',
    path: '/accounting/:id',
    pathParams: z.object({ id: zodId }),
    responses: {
      200: accountingDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete accounting record',
      tags: ['Accounting'],
    },
  },
  getUnaccountedSales: {
    method: 'GET',
    path: '/accounting/unaccounted-sales',
    query: z.object({ date: z.string() }).passthrough(),
    responses: {
      200: unaccountedSalesResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List unaccounted sales',
      tags: ['Accounting'],
    },
  },
  listAccountingCategories: {
    method: 'GET',
    path: '/accounting-categories',
    responses: {
      200: accountingCategoryListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List accounting categories',
      tags: ['Accounting'],
    },
  },
  createAccountingCategory: {
    method: 'POST',
    path: '/accounting-categories',
    body: accountingCategoryCreateSchema,
    responses: {
      200: accountingCategoryResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create accounting category',
      tags: ['Accounting'],
    },
  },
  updateAccountingCategory: {
    method: 'PUT',
    path: '/accounting-categories/:id',
    pathParams: z.object({ id: zodId }),
    body: accountingCategoryUpdateSchema,
    responses: {
      200: accountingCategoryResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update accounting category',
      tags: ['Accounting'],
    },
  },
  deleteAccountingCategory: {
    method: 'DELETE',
    path: '/accounting-categories/:id',
    pathParams: z.object({ id: zodId }),
    responses: {
      200: accountingDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete accounting category',
      tags: ['Accounting'],
    },
  },
})

export type AccountingContract = typeof accountingContract
