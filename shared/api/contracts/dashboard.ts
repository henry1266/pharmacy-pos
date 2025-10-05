import { initContract } from '@ts-rest/core'
import {
  dashboardSummarySchema,
  salesTrendResponseSchema,
} from '../../schemas/zod/dashboard'
import {
  apiErrorResponseSchema,
  createApiResponseSchema,
} from '../../schemas/zod/common'

const c = initContract()

const dashboardSummaryResponseSchema = createApiResponseSchema(dashboardSummarySchema).or(dashboardSummarySchema)
const salesTrendResponseEnvelopeSchema = createApiResponseSchema(salesTrendResponseSchema).or(salesTrendResponseSchema)

export const dashboardContract = c.router({
  getDashboardSummary: {
    method: 'GET',
    path: '/dashboard/summary',
    responses: {
      200: dashboardSummaryResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get dashboard summary',
      tags: ['Dashboard'],
    },
  },
  getSalesTrend: {
    method: 'GET',
    path: '/dashboard/sales-trend',
    responses: {
      200: salesTrendResponseEnvelopeSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get dashboard sales trend',
      tags: ['Dashboard'],
    },
  },
})

export type DashboardContract = typeof dashboardContract
