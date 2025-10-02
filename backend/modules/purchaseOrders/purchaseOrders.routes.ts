import { Router } from 'express';
import { ServerInferRequest } from '@ts-rest/core';
import { purchaseOrdersContract } from '@pharmacy-pos/shared/api/contracts';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import auth from '../../middleware/auth';
import type { AuthenticatedRequest } from '../../src/types/express';
import * as purchaseOrdersService from './purchaseOrders.service';
import logger from '../../utils/logger';

const router: Router = Router();

type GetPurchaseOrderRequest = ServerInferRequest<typeof purchaseOrdersContract['getPurchaseOrderById']>;
type CreatePurchaseOrderRequest = ServerInferRequest<typeof purchaseOrdersContract['createPurchaseOrder']>;
type UpdatePurchaseOrderRequest = ServerInferRequest<typeof purchaseOrdersContract['updatePurchaseOrder']>;
type DeletePurchaseOrderRequest = ServerInferRequest<typeof purchaseOrdersContract['deletePurchaseOrder']>;
type SupplierPurchaseOrdersRequest = ServerInferRequest<typeof purchaseOrdersContract['getPurchaseOrdersBySupplier']>;
type ProductPurchaseOrdersRequest = ServerInferRequest<typeof purchaseOrdersContract['getPurchaseOrdersByProduct']>;
type RecentPurchaseOrdersRequest = ServerInferRequest<typeof purchaseOrdersContract['getRecentPurchaseOrders']>;

type KnownErrorStatus = 400 | 404 | 409 | 500;

type SuccessBody<T> = {
  success: true;
  message: string;
  data: T;
  timestamp: string;
};

type ErrorBody = {
  success: false;
  message: string;
  statusCode: KnownErrorStatus;
  timestamp: string;
};

function toApiPurchaseOrder(order: unknown) {
  if (!order) {
    return order;
  }
  const candidate = order as any;
  if (typeof candidate?.toObject === 'function') {
    return candidate.toObject({ getters: true });
  }
  return candidate;
}

function toApiPurchaseOrders(orders: unknown[]): unknown[] {
  return orders.map((order) => toApiPurchaseOrder(order));
}

function buildSuccessBody<T>(message: string, data: T): SuccessBody<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function buildErrorBody(status: KnownErrorStatus, message: string): ErrorBody {
  return {
    success: false,
    message,
    statusCode: status,
    timestamp: new Date().toISOString(),
  };
}

function resolveDeleteStatus(error?: string): KnownErrorStatus {
  if (!error) {
    return 500;
  }
  if (error.includes('?v?T') || error.includes('completed')) {
    return 400;
  }
  if (error.includes('????') || error.toLowerCase().includes('not found')) {
    return 404;
  }
  return 500;
}

function handleException(error: unknown, logMessage: string) {
  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`);
  return buildErrorBody(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
}

router.get('/', async (_req, res) => {
  try {
    // TODO: add query-aware filtering in service
    const purchaseOrders = await purchaseOrdersService.getAllPurchaseOrders();
    const data = toApiPurchaseOrders(purchaseOrders as unknown[]);
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS, data));
  } catch (err) {
    const body = handleException(err, 'Failed to list purchase orders');
    res.status(body.statusCode).json(body);
  }
});

router.get('/recent/list', async (req, res) => {
  try {
    const query = (req.query ?? {}) as RecentPurchaseOrdersRequest['query'];
    const limit = query?.limit ?? 10;
    const purchaseOrders = await purchaseOrdersService.getRecentPurchaseOrders(limit ?? 10);
    const data = toApiPurchaseOrders(purchaseOrders as unknown[]);
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS, data));
  } catch (err) {
    const body = handleException(err, 'Failed to list recent purchase orders');
    res.status(body.statusCode).json(body);
  }
});

router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const params = req.params as SupplierPurchaseOrdersRequest['params'];
    const purchaseOrders = await purchaseOrdersService.getPurchaseOrdersBySupplier(params.supplierId);
    const data = toApiPurchaseOrders(purchaseOrders as unknown[]);
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS, data));
  } catch (err) {
    const body = handleException(err, 'Failed to list purchase orders by supplier');
    res.status(body.statusCode).json(body);
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const params = req.params as ProductPurchaseOrdersRequest['params'];
    const purchaseOrders = await purchaseOrdersService.getPurchaseOrdersByProduct(params.productId);
    const data = toApiPurchaseOrders(purchaseOrders as unknown[]);
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS, data));
  } catch (err) {
    const body = handleException(err, 'Failed to list purchase orders by product');
    res.status(body.statusCode).json(body);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const params = req.params as GetPurchaseOrderRequest['params'];
    const purchaseOrder = await purchaseOrdersService.getPurchaseOrderById(params.id);
    if (!purchaseOrder) {
      res.status(404).json(buildErrorBody(404, ERROR_MESSAGES.GENERIC.NOT_FOUND));
      return;
    }
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS, toApiPurchaseOrder(purchaseOrder)));
  } catch (err) {
    const body = handleException(err, 'Failed to get purchase order');
    res.status(body.statusCode).json(body);
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const body = req.body as CreatePurchaseOrderRequest['body'];
    const userId = (req as AuthenticatedRequest).user?.id;
    const result = await purchaseOrdersService.createPurchaseOrder(body, userId);
    if (!result.success || !result.purchaseOrder) {
      const status = result.error ? (result.error.includes('?T??') ? 409 : result.error.includes('?�V?') ? 401 : 400) : 400;
      res.status(status).json(buildErrorBody(status as KnownErrorStatus, result.error ?? ERROR_MESSAGES.GENERIC.VALIDATION_FAILED));
      return;
    }
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.CREATED, toApiPurchaseOrder(result.purchaseOrder)));
  } catch (err) {
    const body = handleException(err, 'Failed to create purchase order');
    res.status(body.statusCode).json(body);
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const params = req.params as UpdatePurchaseOrderRequest['params'];
    const body = req.body as UpdatePurchaseOrderRequest['body'];
    const userId = (req as AuthenticatedRequest).user?.id;
    const result = await purchaseOrdersService.updatePurchaseOrder(params.id, body, userId);
    if (!result.success || !result.purchaseOrder) {
      const status = result.error ? (result.error.includes('????') ? 404 : result.error.includes('?T??') ? 409 : 400) : 400;
      res.status(status).json(buildErrorBody(status as KnownErrorStatus, result.error ?? ERROR_MESSAGES.GENERIC.VALIDATION_FAILED));
      return;
    }
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.UPDATED, toApiPurchaseOrder(result.purchaseOrder)));
  } catch (err) {
    const body = handleException(err, 'Failed to update purchase order');
    res.status(body.statusCode).json(body);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const params = req.params as DeletePurchaseOrderRequest['params'];
    const result = await purchaseOrdersService.deletePurchaseOrder(params.id);
    if (!result.success) {
      const status = resolveDeleteStatus(result.error);
      res.status(status).json(buildErrorBody(status, result.error ?? ERROR_MESSAGES.GENERIC.SERVER_ERROR));
      return;
    }
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.DELETED, { id: params.id }));
  } catch (err) {
    const body = handleException(err, 'Failed to delete purchase order');
    res.status(body.statusCode).json(body);
  }
});

export default router;




