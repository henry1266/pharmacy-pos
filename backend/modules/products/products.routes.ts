import { Router } from 'express'
import { initServer, createExpressEndpoints } from '@ts-rest/express'
import type { ServerInferRequest } from '@ts-rest/core'
import { productsContract } from '@pharmacy-pos/shared/api/contracts'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
import logger from '../../utils/logger'
import {
  listProducts,
  listBaseProducts,
  listMedicines,
  getProductByCode,
  getProductById,
  createProduct,
  createMedicine,
  updateProduct,
  deleteProduct,
  ProductServiceError,
  ProductServiceErrorStatus,
} from './products.service'

const server = initServer()

export type ListProductsRequest = ServerInferRequest<typeof productsContract['listProducts']>
export type ListBaseProductsRequest = ServerInferRequest<typeof productsContract['listBaseProducts']>
export type ListMedicinesRequest = ServerInferRequest<typeof productsContract['listMedicines']>
export type GetProductByCodeRequest = ServerInferRequest<typeof productsContract['getProductByCode']>
export type GetProductByIdRequest = ServerInferRequest<typeof productsContract['getProductById']>
export type CreateProductRequest = ServerInferRequest<typeof productsContract['createProduct']>
export type CreateMedicineRequest = ServerInferRequest<typeof productsContract['createMedicine']>
export type UpdateProductRequest = ServerInferRequest<typeof productsContract['updateProduct']>
export type DeleteProductRequest = ServerInferRequest<typeof productsContract['deleteProduct']>

type KnownErrorStatus = ProductServiceErrorStatus

const implementation = server.router(productsContract, {
  listProducts: async ({ query }: ListProductsRequest) => {
    try {
      const result = await listProducts(query ?? {})
      return successListResponse(200, result, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError(error, 'Failed to list products', [500] as const) as any
    }
  },
  listBaseProducts: async (_request: ListBaseProductsRequest) => {
    try {
      const result = await listBaseProducts()
      return successListResponse(200, result, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError(error, 'Failed to list base products', [500] as const) as any
    }
  },
  listMedicines: async (_request: ListMedicinesRequest) => {
    try {
      const result = await listMedicines()
      return successListResponse(200, result, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError(error, 'Failed to list medicines', [500] as const) as any
    }
  },
  getProductByCode: async ({ params }: GetProductByCodeRequest) => {
    try {
      const product = await getProductByCode(params.code)
      if (!product) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(200, product, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError(error, 'Failed to get product by code', [404, 500] as const) as any
    }
  },
  getProductById: async ({ params }: GetProductByIdRequest) => {
    try {
      const product = await getProductById(params.id)
      if (!product) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(200, product, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError(error, 'Failed to get product by id', [404, 500] as const) as any
    }
  },
  createProduct: async ({ body }: CreateProductRequest) => {
    try {
      const product = await createProduct(body)
      return successResponse(201, product, SUCCESS_MESSAGES.GENERIC.CREATED)
    } catch (error) {
      return handleError(error, 'Failed to create product', [400, 409, 500] as const) as any
    }
  },
  createMedicine: async ({ body }: CreateMedicineRequest) => {
    try {
      const product = await createMedicine(body)
      return successResponse(201, product, SUCCESS_MESSAGES.GENERIC.CREATED)
    } catch (error) {
      return handleError(error, 'Failed to create medicine', [400, 409, 500] as const) as any
    }
  },
  updateProduct: async ({ params, body }: UpdateProductRequest) => {
    try {
      const product = await updateProduct(params.id, body)
      return successResponse(200, product, SUCCESS_MESSAGES.GENERIC.UPDATED)
    } catch (error) {
      return handleError(error, 'Failed to update product', [400, 404, 500] as const) as any
    }
  },
  deleteProduct: async ({ params }: DeleteProductRequest) => {
    try {
      const result = await deleteProduct(params.id)
      return successResponse(200, result, SUCCESS_MESSAGES.GENERIC.DELETED)
    } catch (error) {
      return handleError(error, 'Failed to delete product', [404, 500] as const) as any
    }
  },
})

function successListResponse<TStatus extends number>(
  status: TStatus,
  result: Awaited<ReturnType<typeof listProducts>>,
  message: string,
) {
  return {
    status,
    body: {
      success: true,
      message,
      data: result?.data,
      filters: result?.filters,
      count: result?.count,
      timestamp: new Date().toISOString(),
    },
  } as const
}

function successResponse<TStatus extends number>(status: TStatus, data: unknown, message: string) {
  return {
    status,
    body: {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  } as const
}

function errorResponse<TStatus extends KnownErrorStatus>(status: TStatus, message: string) {
  return {
    status,
    body: {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    },
  } as const
}

function handleError<Allowed extends KnownErrorStatus>(
  error: unknown,
  logMessage: string,
  allowedStatuses: readonly Allowed[],
) {
  const defaultStatus = (allowedStatuses.find((status) => status === 500) ?? allowedStatuses[0]) as Allowed

  if (error instanceof ProductServiceError) {
    const status = error.status as Allowed
    const finalStatus = allowedStatuses.includes(status) ? status : defaultStatus
    return errorResponse(finalStatus, error.message)
  }

  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`)
  return errorResponse(defaultStatus, ERROR_MESSAGES.GENERIC.SERVER_ERROR)
}

const router: Router = Router()
createExpressEndpoints(productsContract, implementation, router)

export default router
