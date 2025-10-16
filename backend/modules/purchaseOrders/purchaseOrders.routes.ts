import { Router } from 'express';
import { initServer, createExpressEndpoints } from '@ts-rest/express';
import type { ServerInferRequest } from '@ts-rest/core';

import { purchaseOrdersContract } from '@pharmacy-pos/shared/api/contracts';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, API_CONSTANTS } from '@pharmacy-pos/shared/constants';

import auth from '../../middleware/auth';
import type { AuthenticatedRequest } from '../../src/types/express';
import * as purchaseOrdersService from './purchaseOrders.service';
import type { IPurchaseOrderDocument } from './purchaseOrders.types';
import { createValidationErrorHandler } from '../common/tsRest';
import {
  toPurchaseOrderSummary,
  toPurchaseOrderSummaries,
  toPurchaseOrderDetail,
} from './utils/serialization';
import {
  createSummaryListResponse,
  createDetailResponse,
  createDeleteResponse,
  createErrorResponse,
  resolveServiceError,
  handleException,
} from './utils/responses';

const router: Router = Router();
const server = initServer();

router.use('/purchase-orders', (req, res, next) => {
  const method = req.method.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    return auth(req, res, next);
  }
  return next();
});

type ListPurchaseOrdersRequest = ServerInferRequest<typeof purchaseOrdersContract['listPurchaseOrders']>;
type ListRecentPurchaseOrdersRequest = ServerInferRequest<typeof purchaseOrdersContract['listRecentPurchaseOrders']>;
type ListBySupplierRequest = ServerInferRequest<typeof purchaseOrdersContract['listPurchaseOrdersBySupplier']>;
type ListByProductRequest = ServerInferRequest<typeof purchaseOrdersContract['listPurchaseOrdersByProduct']>;
type GetPurchaseOrderRequest = ServerInferRequest<typeof purchaseOrdersContract['getPurchaseOrderById']>;
type CreatePurchaseOrderRequest = ServerInferRequest<typeof purchaseOrdersContract['createPurchaseOrder']>;
type UpdatePurchaseOrderRequest = ServerInferRequest<typeof purchaseOrdersContract['updatePurchaseOrder']>;
type DeletePurchaseOrderRequest = ServerInferRequest<typeof purchaseOrdersContract['deletePurchaseOrder']>;

const mapToSummaryList = (orders: IPurchaseOrderDocument[]) =>
  toPurchaseOrderSummaries(orders);

const implementation = server.router(purchaseOrdersContract, {
  listPurchaseOrders: async (_req: ListPurchaseOrdersRequest) => {
    try {
      const purchaseOrders = await purchaseOrdersService.getAllPurchaseOrders();
      return createSummaryListResponse(mapToSummaryList(purchaseOrders));
    } catch (error) {
      return handleException(error, 'Failed to list purchase orders');
    }
  },
  listRecentPurchaseOrders: async ({ query }: ListRecentPurchaseOrdersRequest) => {
    try {
      const limit = query?.limit ?? 10;
      const purchaseOrders = await purchaseOrdersService.getRecentPurchaseOrders(limit);
      return createSummaryListResponse(mapToSummaryList(purchaseOrders));
    } catch (error) {
      return handleException(error, 'Failed to list recent purchase orders');
    }
  },
  listPurchaseOrdersBySupplier: async ({ params }: ListBySupplierRequest) => {
    try {
      const purchaseOrders = await purchaseOrdersService.getPurchaseOrdersBySupplier(params.supplierId);
      return createSummaryListResponse(mapToSummaryList(purchaseOrders));
    } catch (error) {
      return handleException(error, 'Failed to list purchase orders by supplier');
    }
  },
  listPurchaseOrdersByProduct: async ({ params }: ListByProductRequest) => {
    try {
      const purchaseOrders = await purchaseOrdersService.getPurchaseOrdersByProduct(params.productId);
      return createSummaryListResponse(mapToSummaryList(purchaseOrders));
    } catch (error) {
      return handleException(error, 'Failed to list purchase orders by product');
    }
  },
  getPurchaseOrderById: async ({ params }: GetPurchaseOrderRequest) => {
    try {
      const purchaseOrder = await purchaseOrdersService.getPurchaseOrderById(params.id);
      if (!purchaseOrder) {
        return createErrorResponse({
          status: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
          code: 'NOT_FOUND',
          message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        });
      }

      return createDetailResponse(
        toPurchaseOrderDetail(purchaseOrder),
        API_CONSTANTS.HTTP_STATUS.OK,
      );
    } catch (error) {
      return handleException(error, 'Failed to get purchase order');
    }
  },
  createPurchaseOrder: async ({ body, req }: CreatePurchaseOrderRequest) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.id;
      if (!userId) {
        return createErrorResponse({
          status: API_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
          code: 'UNAUTHORIZED',
          message: ERROR_MESSAGES.GENERIC.UNAUTHORIZED,
        });
      }

      const result = await purchaseOrdersService.createPurchaseOrder(body, userId);

      if (!result.success || !result.purchaseOrder) {
        console.error('create purchase order error', result.error);
        const resolved = resolveServiceError(result.error);
        return createErrorResponse(resolved);
      }

      return createDetailResponse(
        toPurchaseOrderDetail(result.purchaseOrder),
        API_CONSTANTS.HTTP_STATUS.OK,
        SUCCESS_MESSAGES.GENERIC.CREATED ?? 'Created',
      );
    } catch (error) {
      return handleException(error, 'Failed to create purchase order');
    }
  },
  updatePurchaseOrder: async ({ params, body, req }: UpdatePurchaseOrderRequest) => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.id;
      if (!userId) {
        return createErrorResponse({
          status: API_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
          code: 'UNAUTHORIZED',
          message: ERROR_MESSAGES.GENERIC.UNAUTHORIZED,
        });
      }

      const result = await purchaseOrdersService.updatePurchaseOrder(params.id, body, userId);
      if (!result.success || !result.purchaseOrder) {
        console.error('update purchase order error', result.error);
        const resolved = resolveServiceError(result.error);
        return createErrorResponse(resolved);
      }

      return createDetailResponse(
        toPurchaseOrderDetail(result.purchaseOrder),
        API_CONSTANTS.HTTP_STATUS.OK,
        SUCCESS_MESSAGES.GENERIC.UPDATED ?? 'Updated',
      );
    } catch (error) {
      return handleException(error, 'Failed to update purchase order');
    }
  },
  deletePurchaseOrder: async ({ params }: DeletePurchaseOrderRequest) => {
    try {
      const result = await purchaseOrdersService.deletePurchaseOrder(params.id);
      if (!result.success) {
        const resolved = resolveServiceError(result.error);
        return createErrorResponse(resolved);
      }

      return createDeleteResponse(
        params.id,
        API_CONSTANTS.HTTP_STATUS.OK,
        SUCCESS_MESSAGES.GENERIC.DELETED ?? 'Deleted',
      );
    } catch (error) {
      return handleException(error, 'Failed to delete purchase order');
    }
  },
});

createExpressEndpoints(purchaseOrdersContract, implementation, router, {
  requestValidationErrorHandler: createValidationErrorHandler({
    defaultStatus: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
    pathParamStatus: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
  }),
});

export default router;
