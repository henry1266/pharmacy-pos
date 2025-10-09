import { initServer } from '@ts-rest/express'
import type { ServerInferRequest } from '@ts-rest/core'
import { productsContract } from '@pharmacy-pos/shared/api/contracts'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
const SERVER_ERROR_MESSAGE = ERROR_MESSAGES.GENERIC?.SERVER_ERROR ?? '\\u4F3A\\u670D\\u5668\\u767C\\u751F\\u932F\\u8AA4'
const NOT_FOUND_MESSAGE = ERROR_MESSAGES.GENERIC?.NOT_FOUND ?? '\\u627E\\u4E0D\\u5230\\u8CC7\\u6E90'

import logger from '../../../utils/logger'
import {
  listProducts,
  listBaseProducts,
  listMedicines,
  getProductByCode,
  getProductById,
  createProduct as createProductService,
  createMedicine as createMedicineService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
  ProductServiceError,
  ProductServiceErrorStatus,
  ProductListResult,
} from '../services/product.service'

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

type SuccessBody = {
  success: true
  message: string
  timestamp: Date
  data?: unknown
  [key: string]: unknown
}

type ErrorBody = {
  success: false
  message: string
  statusCode: KnownErrorStatus
  error?: string
  timestamp: Date
}

function createSuccessEnvelope<TStatus extends number>(
  status: TStatus,
  message: string,
  data?: unknown,
  extra?: Record<string, unknown>,
) {
  const body: SuccessBody = {
    success: true,
    message,
    timestamp: new Date(),
    ...(data === undefined ? {} : { data }),
    ...(extra ?? {}),
  }

  return {
    status,
    body,
  } as const
}

function successListResponse<TStatus extends number>(
  status: TStatus,
  result: ProductListResult,
  message: string,
) {
  return createSuccessEnvelope(status, message, result?.data, {
    filters: result?.filters ?? undefined,
    count: result?.count ?? undefined,
  })
}

function successResponse<TStatus extends number>(status: TStatus, data: unknown, message: string) {
  return createSuccessEnvelope(status, message, data)
}

function errorResponse<TStatus extends KnownErrorStatus>(
  status: TStatus,
  message: string,
  error?: unknown,
) {
  const body: ErrorBody = {
    success: false,
    message,
    statusCode: status,
    timestamp: new Date(),
    ...(error instanceof Error ? { error: error.message } : {}),
  }

  return {
    status,
    body,
  } as const
}

function isProductServiceError(error: unknown): error is ProductServiceError {
  return error instanceof ProductServiceError
}

function handleError<Allowed extends KnownErrorStatus>(
  error: unknown,
  logMessage: string,
  allowedStatuses: readonly Allowed[],
) {
  const defaultStatus = (allowedStatuses.find((status) => status === 500) ?? allowedStatuses[0]) as Allowed

  if (isProductServiceError(error)) {
    const status = error.status as Allowed
    const finalStatus = allowedStatuses.includes(status) ? status : defaultStatus
    return errorResponse(finalStatus, error.message)
  }

  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`)
  return errorResponse(defaultStatus, SERVER_ERROR_MESSAGE, error)
}

export const productsController = server.router(productsContract, {
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
        return errorResponse(404, NOT_FOUND_MESSAGE)
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
        return errorResponse(404, NOT_FOUND_MESSAGE)
      }
      return successResponse(200, product, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError(error, 'Failed to get product by id', [404, 500] as const) as any
    }
  },
  createProduct: async ({ body }: CreateProductRequest) => {
    try {
      const product = await createProductService(body)
      return successResponse(201, product, SUCCESS_MESSAGES.PRODUCT.CREATED)
    } catch (error) {
      return handleError(error, 'Failed to create product', [400, 409, 500] as const) as any
    }
  },
  createMedicine: async ({ body }: CreateMedicineRequest) => {
    try {
      const product = await createMedicineService(body)
      return successResponse(201, product, SUCCESS_MESSAGES.PRODUCT.MEDICINE_CREATED)
    } catch (error) {
      return handleError(error, 'Failed to create medicine', [400, 409, 500] as const) as any
    }
  },
  updateProduct: async ({ params, body }: UpdateProductRequest) => {
    try {
      const product = await updateProductService(params.id, body)
      return successResponse(200, product, SUCCESS_MESSAGES.GENERIC.UPDATED)
    } catch (error) {
      return handleError(error, 'Failed to update product', [400, 404, 409, 500] as const) as any
    }
  },
  deleteProduct: async ({ params }: DeleteProductRequest) => {
    try {
      const product = await deleteProductService(params.id)
      return successResponse(200, product, SUCCESS_MESSAGES.GENERIC.DELETED)
    } catch (error) {
      return handleError(error, 'Failed to delete product', [404, 500] as const) as any
    }
  },
})








