import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  supplierAccountMappingListQuerySchema,
  supplierAccountMappingBySupplierQuerySchema,
  createSupplierAccountMappingSchema,
  updateSupplierAccountMappingSchema,
  supplierAccountMappingEnvelopeSchema,
  supplierAccountMappingListEnvelopeSchema,
  supplierAccountMappingDeleteEnvelopeSchema,
} from '../../schemas/zod/supplierAccountMapping';
import { apiErrorResponseSchema } from '../../schemas/zod/common';
import { zodId } from '../../utils/zodUtils';

const c = initContract();

const mappingIdParamsSchema = z.object({
  id: zodId,
});

const supplierIdParamsSchema = z.object({
  supplierId: zodId,
});

export const supplierAccountMappingsContract = c.router({
  listMappings: {
    method: 'GET',
    path: '/supplier-account-mappings',
    query: supplierAccountMappingListQuerySchema.optional(),
    responses: {
      200: supplierAccountMappingListEnvelopeSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: '列出供應商帳務對應',
      tags: ['SupplierAccountMappings'],
    },
  },
  getMappingBySupplier: {
    method: 'GET',
    path: '/supplier-account-mappings/supplier/:supplierId/accounts',
    pathParams: supplierIdParamsSchema,
    query: supplierAccountMappingBySupplierQuerySchema.optional(),
    responses: {
      200: supplierAccountMappingEnvelopeSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: '查詢指定供應商的帳務對應',
      tags: ['SupplierAccountMappings'],
    },
  },
  getMappingById: {
    method: 'GET',
    path: '/supplier-account-mappings/:id',
    pathParams: mappingIdParamsSchema,
    responses: {
      200: supplierAccountMappingEnvelopeSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: '取得單一帳務對應詳細',
      tags: ['SupplierAccountMappings'],
    },
  },
  createMapping: {
    method: 'POST',
    path: '/supplier-account-mappings',
    body: createSupplierAccountMappingSchema,
    responses: {
      201: supplierAccountMappingEnvelopeSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: '建立帳務對應',
      tags: ['SupplierAccountMappings'],
    },
  },
  updateMapping: {
    method: 'PUT',
    path: '/supplier-account-mappings/:id',
    pathParams: mappingIdParamsSchema,
    body: updateSupplierAccountMappingSchema,
    responses: {
      200: supplierAccountMappingEnvelopeSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: '更新帳務對應',
      tags: ['SupplierAccountMappings'],
    },
  },
  deleteMapping: {
    method: 'DELETE',
    path: '/supplier-account-mappings/:id',
    pathParams: mappingIdParamsSchema,
    responses: {
      200: supplierAccountMappingDeleteEnvelopeSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: '刪除帳務對應',
      tags: ['SupplierAccountMappings'],
    },
  },
});

export type SupplierAccountMappingsContract = typeof supplierAccountMappingsContract;
