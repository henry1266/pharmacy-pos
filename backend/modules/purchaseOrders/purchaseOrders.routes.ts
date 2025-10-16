import { Router } from 'express';
import { initServer, createExpressEndpoints } from '@ts-rest/express';
import { purchaseOrdersContract } from '@pharmacy-pos/shared/api/contracts';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import type {
  PurchaseOrderSummary,
  PurchaseOrderDetail,
  PurchaseOrderRequest,
  PurchaseOrderUpdateRequest,
} from '@pharmacy-pos/shared/types/purchase-order';
import auth from '../../middleware/auth';
import type { AuthenticatedRequest } from '../../src/types/express';
import * as purchaseOrdersService from './purchaseOrders.service';
import type { IPurchaseOrderDocument } from './purchaseOrders.types';
import logger from '../../utils/logger';
import { createValidationErrorHandler } from '../common/tsRest';

const router: Router = Router();
const server = initServer();

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

const ensureString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    const candidate = value as { _id?: unknown; toString?: () => string; toHexString?: () => string };
    if (typeof candidate.toHexString === 'function') {
      return candidate.toHexString();
    }
    if (typeof candidate.toString === 'function') {
      const stringified = candidate.toString();
      if (stringified && stringified !== '[object Object]') {
        return stringified;
      }
    }
    if (candidate._id !== undefined) {
      if (candidate._id === value) {
        return undefined;
      }
      return ensureString(candidate._id);
    }
  }
  return undefined;
};

const ensureDateString = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : undefined;
};

const toPlainOrder = (order: IPurchaseOrderDocument) =>
  order.toObject({
    getters: true,
    virtuals: false,
  }) as Record<string, any>;

const mapSupplierReference = (supplier: unknown): PurchaseOrderDetail['supplier'] => {
  if (!supplier) {
    return undefined;
  }
  if (typeof supplier === 'string') {
    return supplier;
  }
  if (typeof supplier === 'object') {
    const candidate = supplier as Record<string, unknown>;
    if ('name' in candidate || 'code' in candidate || 'shortCode' in candidate) {
      const mapped: Record<string, unknown> = { ...candidate };
      if (candidate._id !== undefined) {
        mapped._id = ensureString(candidate._id);
      }
      return mapped;
    }
  }
  return ensureString(supplier);
};

const mapProductReference = (product: unknown): PurchaseOrderDetail['items'][number]['product'] => {
  if (!product) {
    return undefined;
  }
  if (typeof product === 'string') {
    return product;
  }
  if (typeof product === 'object') {
    const candidate = product as Record<string, unknown>;
    if ('name' in candidate || 'code' in candidate) {
      const mapped: Record<string, unknown> = { ...candidate };
      if (candidate._id !== undefined) {
        mapped._id = ensureString(candidate._id);
      }
      return mapped;
    }
  }
  return ensureString(product);
};

const mapSelectedAccountIds = (input: unknown): string[] | undefined => {
  if (!Array.isArray(input)) {
    return undefined;
  }
  const ids = input
    .map((value) => ensureString(value))
    .filter((value): value is string => Boolean(value));
  return ids.length > 0 ? Array.from(new Set(ids)) : undefined;
};

const mapSummaryItems = (items: unknown): NonNullable<PurchaseOrderSummary['items']> => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => {
      const candidate = item as Record<string, any>;
      if (!candidate?.did || !candidate?.dname) {
        return undefined;
      }
      return {
        _id: ensureString(candidate._id),
        did: candidate.did,
        dname: candidate.dname,
        dquantity: Number(candidate.dquantity ?? 0),
        dtotalCost: Number(candidate.dtotalCost ?? 0),
        unitPrice:
          candidate.unitPrice === undefined || candidate.unitPrice === null
            ? undefined
            : Number(candidate.unitPrice),
      };
    })
    .filter((value): value is NonNullable<PurchaseOrderSummary['items']>[number] => Boolean(value));
};

const mapDetailItems = (items: unknown, sourceItems: unknown[]): PurchaseOrderDetail['items'] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item, index) => {
    const candidate = item as Record<string, any>;
    const fallbackSource = Array.isArray(sourceItems) ? (sourceItems[index] as Record<string, any> | undefined) : undefined;
    return {
      _id: ensureString(candidate._id),
      did: candidate.did,
      dname: candidate.dname,
      dquantity: Number(candidate.dquantity ?? 0),
      dtotalCost: Number(candidate.dtotalCost ?? 0),
      unitPrice:
        candidate.unitPrice === undefined || candidate.unitPrice === null
          ? undefined
          : Number(candidate.unitPrice),
      receivedQuantity:
        candidate.receivedQuantity === undefined || candidate.receivedQuantity === null
          ? undefined
          : Number(candidate.receivedQuantity),
      batchNumber: candidate.batchNumber ?? undefined,
      packageQuantity:
        candidate.packageQuantity === undefined || candidate.packageQuantity === null
          ? undefined
          : Number(candidate.packageQuantity),
      boxQuantity:
        candidate.boxQuantity === undefined || candidate.boxQuantity === null
          ? undefined
          : Number(candidate.boxQuantity),
      notes: candidate.notes ?? undefined,
      product: mapProductReference(candidate.product ?? fallbackSource?.product),
    };
  });
};

const toPurchaseOrderSummary = (order: IPurchaseOrderDocument): PurchaseOrderSummary => {
  const plain = toPlainOrder(order);
  const summary: PurchaseOrderSummary = {
    _id: ensureString(plain._id) ?? '',
    poid: plain.poid ?? '',
    orderNumber: plain.orderNumber ?? plain.poid ?? '',
    pobill: plain.pobill ?? undefined,
    pobilldate: ensureDateString(plain.pobilldate),
    posupplier: plain.posupplier ?? '',
    organizationId: ensureString(plain.organizationId),
    transactionType: plain.transactionType ?? undefined,
    accountingEntryType: plain.accountingEntryType ?? undefined,
    selectedAccountIds: mapSelectedAccountIds(plain.selectedAccountIds),
    relatedTransactionGroupId: ensureString(plain.relatedTransactionGroupId),
    totalAmount: Number(plain.totalAmount ?? 0),
    status: plain.status,
    paymentStatus: plain.paymentStatus ?? undefined,
    notes: plain.notes ?? undefined,
    supplier: mapSupplierReference(plain.supplier),
    createdAt: ensureDateString(plain.createdAt) ?? new Date().toISOString(),
    updatedAt: ensureDateString(plain.updatedAt) ?? new Date().toISOString(),
  };

  const items = mapSummaryItems(plain.items);
  if (items.length > 0) {
    summary.items = items;
  }

  return summary;
};

const toPurchaseOrderDetail = (order: IPurchaseOrderDocument): PurchaseOrderDetail => {
  const plain = toPlainOrder(order);
  const summary = toPurchaseOrderSummary(order);
  return {
    ...summary,
    orderDate: ensureDateString(plain.orderDate),
    expectedDeliveryDate: ensureDateString(plain.expectedDeliveryDate),
    actualDeliveryDate: ensureDateString(plain.actualDeliveryDate),
    items: mapDetailItems(plain.items, (order as any).items ?? []),
    selectedAccountIds: summary.selectedAccountIds,
  };
};

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
  const message = error instanceof Error
    ? error.stack ?? error.message
    : String(error);
  logger.error(`${logMessage}: ${message}`);
  return buildErrorBody(500, ERROR_MESSAGES.GENERIC.SERVER_ERROR);
}

const contractRouter = server.router(purchaseOrdersContract, {
  listPurchaseOrders: async () => {
    try {
      const purchaseOrders = await purchaseOrdersService.getAllPurchaseOrders();
      const data = purchaseOrders.map((order) => toPurchaseOrderSummary(order));
      return {
        status: 200,
        body: buildSuccessBody(SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS, data),
      };
    } catch (error) {
      const body = handleException(error, 'Failed to list purchase orders');
      return {
        status: body.statusCode,
        body,
      };
    }
  },
  getPurchaseOrderById: async ({ params }) => {
    try {
      const purchaseOrder = await purchaseOrdersService.getPurchaseOrderById(params.id);
      if (!purchaseOrder) {
        const body = buildErrorBody(404, ERROR_MESSAGES.GENERIC.NOT_FOUND);
        return {
          status: 404,
          body,
        };
      }
      return {
        status: 200,
        body: buildSuccessBody(
          SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
          toPurchaseOrderDetail(purchaseOrder),
        ),
      };
    } catch (error) {
      const body = handleException(error, 'Failed to get purchase order');
      return {
        status: body.statusCode,
        body,
      };
    }
  },
});

createExpressEndpoints(purchaseOrdersContract, contractRouter, router, {
  requestValidationErrorHandler: createValidationErrorHandler({
    defaultStatus: 400,
    pathParamStatus: 404,
  }),
});

router.get('/purchase-orders/recent/list', async (req, res) => {
  try {
    const rawLimit = typeof req.query?.limit === 'string' ? Number(req.query.limit) : undefined;
    const limit = Number.isFinite(rawLimit) ? Number(rawLimit) : 10;
    const purchaseOrders = await purchaseOrdersService.getRecentPurchaseOrders(limit);
    const data = purchaseOrders.map((order) => toPurchaseOrderSummary(order));
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS, data));
  } catch (err) {
    const body = handleException(err, 'Failed to list recent purchase orders');
    res.status(body.statusCode).json(body);
  }
});

router.get('/purchase-orders/supplier/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const purchaseOrders = await purchaseOrdersService.getPurchaseOrdersBySupplier(supplierId);
    const data = purchaseOrders.map((order) => toPurchaseOrderSummary(order));
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS, data));
  } catch (err) {
    const body = handleException(err, 'Failed to list purchase orders by supplier');
    res.status(body.statusCode).json(body);
  }
});

router.get('/purchase-orders/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const purchaseOrders = await purchaseOrdersService.getPurchaseOrdersByProduct(productId);
    const data = purchaseOrders.map((order) => toPurchaseOrderSummary(order));
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS, data));
  } catch (err) {
    const body = handleException(err, 'Failed to list purchase orders by product');
    res.status(body.statusCode).json(body);
  }
});

router.post('/purchase-orders', auth, async (req, res) => {
  try {
    const body = req.body as PurchaseOrderRequest;
    const userId = (req as AuthenticatedRequest).user?.id;
    const result = await purchaseOrdersService.createPurchaseOrder(body, userId);
    if (!result.success || !result.purchaseOrder) {
      const status = result.error
        ? result.error.includes('?T??')
          ? 409
          : result.error.includes('??V?')
            ? 401
            : 400
        : 400;
      res
        .status(status)
        .json(buildErrorBody(status as KnownErrorStatus, result.error ?? ERROR_MESSAGES.GENERIC.VALIDATION_FAILED));
      return;
    }
    res
      .status(200)
      .json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.CREATED, toPurchaseOrderDetail(result.purchaseOrder)));
  } catch (err) {
    const body = handleException(err, 'Failed to create purchase order');
    res.status(body.statusCode).json(body);
  }
});

router.put('/purchase-orders/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as PurchaseOrderUpdateRequest;
    const userId = (req as AuthenticatedRequest).user?.id;
    const result = await purchaseOrdersService.updatePurchaseOrder(id, body, userId);
    if (!result.success || !result.purchaseOrder) {
      const status = result.error
        ? result.error.includes('????')
          ? 404
          : result.error.includes('?T??')
            ? 409
            : 400
        : 400;
      res
        .status(status)
        .json(buildErrorBody(status as KnownErrorStatus, result.error ?? ERROR_MESSAGES.GENERIC.VALIDATION_FAILED));
      return;
    }
    res
      .status(200)
      .json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.UPDATED, toPurchaseOrderDetail(result.purchaseOrder)));
  } catch (err) {
    const body = handleException(err, 'Failed to update purchase order');
    res.status(body.statusCode).json(body);
  }
});

router.delete('/purchase-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await purchaseOrdersService.deletePurchaseOrder(id);
    if (!result.success) {
      const status = resolveDeleteStatus(result.error);
      res.status(status).json(buildErrorBody(status, result.error ?? ERROR_MESSAGES.GENERIC.SERVER_ERROR));
      return;
    }
    res.status(200).json(buildSuccessBody(SUCCESS_MESSAGES.GENERIC.DELETED, { id }));
  } catch (err) {
    const body = handleException(err, 'Failed to delete purchase order');
    res.status(body.statusCode).json(body);
  }
});

export default router;
