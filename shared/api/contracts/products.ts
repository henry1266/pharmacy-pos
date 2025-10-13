import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import {
  productSchema,
  productCreateSchema,
  productUpdateSchema,
  productQuerySchema,
  productListFiltersSchema,
} from '../../schemas/zod/product'
import {
  productDescriptionParamsSchema,
  productDescriptionUpdateSchema,
  productDescriptionResponseSchema,
} from '../../schemas/zod/productDescription'
import {
  apiErrorResponseSchema,
  apiSuccessEnvelopeSchema,
  createApiResponseSchema,
} from '../../schemas/zod/common'
import { zodId } from '../../utils/zodUtils'

const c = initContract()

export const productResponseSchema = createApiResponseSchema(productSchema).or(productSchema)

export const productListEnvelopeSchema = apiSuccessEnvelopeSchema
  .extend({
    data: z.array(productSchema).optional(),
    filters: productListFiltersSchema.optional(),
    count: z.number().optional(),
  })
  .passthrough()

export const productListResponseSchema = productListEnvelopeSchema.or(z.array(productSchema))
const productDescriptionResponseEnvelope = createApiResponseSchema(productDescriptionResponseSchema)

export const productsContract = c.router({
  listProducts: {
    method: 'GET',
    path: '/products',
    query: productQuerySchema.optional(),
    responses: {
      200: productListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List products',
      tags: ['Products'],
    },
  },
  listBaseProducts: {
    method: 'GET',
    path: '/products/products',
    responses: {
      200: productListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List base products',
      tags: ['Products'],
    },
  },
  listMedicines: {
    method: 'GET',
    path: '/products/medicines',
    responses: {
      200: productListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List medicine products',
      tags: ['Products'],
    },
  },
  getProductByCode: {
    method: 'GET',
    path: '/products/code/:code',
    pathParams: z.object({ code: z.string() }),
    responses: {
      200: productResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get product by code',
      tags: ['Products'],
    },
  },
  getProductById: {
    method: 'GET',
    path: '/products/:id',
    pathParams: z.object({ id: zodId }),
    responses: {
      200: productResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get product detail',
      tags: ['Products'],
    },
  },
  createProduct: {
    method: 'POST',
    path: '/products/product',
    body: productCreateSchema,
    responses: {
      201: productResponseSchema,
      400: apiErrorResponseSchema,
      409: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create product',
      tags: ['Products'],
    },
  },
  createMedicine: {
    method: 'POST',
    path: '/products/medicine',
    body: productCreateSchema,
    responses: {
      201: productResponseSchema,
      400: apiErrorResponseSchema,
      409: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create medicine product',
      tags: ['Products'],
    },
  },
  updateProduct: {
    method: 'PUT',
    path: '/products/:id',
    pathParams: z.object({ id: zodId }),
    body: productUpdateSchema,
    responses: {
      200: productResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update product',
      tags: ['Products'],
    },
  },
  deleteProduct: {
    method: 'DELETE',
    path: '/products/:id',
    pathParams: z.object({ id: zodId }),
    responses: {
      200: productResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete product',
      tags: ['Products'],
    },
  },
  getProductDescription: {
    method: 'GET',
    path: '/products/:productId/description',
    pathParams: productDescriptionParamsSchema,
    responses: {
      200: productDescriptionResponseEnvelope,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get product description',
      tags: ['Products'],
    },
  },
  upsertProductDescription: {
    method: 'PATCH',
    path: '/products/:productId/description',
    pathParams: productDescriptionParamsSchema,
    body: productDescriptionUpdateSchema,
    responses: {
      200: productDescriptionResponseEnvelope,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update product description',
      tags: ['Products'],
    },
  },
})

export type ProductsContract = typeof productsContract
