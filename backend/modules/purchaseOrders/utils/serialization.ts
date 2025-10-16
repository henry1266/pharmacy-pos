import type { PurchaseOrderDetail, PurchaseOrderSummary } from '@pharmacy-pos/shared/types/purchase-order';
import {
  purchaseOrderDetailSchema,
  purchaseOrderSummarySchema,
} from '@pharmacy-pos/shared/schemas/purchase-orders';

import type { IPurchaseOrderDocument } from '../purchaseOrders.types';

type PlainPurchaseOrder = Record<string, any>;

export const ensureString = (value: unknown): string | undefined => {
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

const toPlainOrder = (order: IPurchaseOrderDocument): PlainPurchaseOrder =>
  order.toObject({
    getters: true,
    virtuals: false,
  }) as PlainPurchaseOrder;

const mapSupplierReference = (
  supplier: unknown,
): PurchaseOrderDetail['supplier'] => {
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

const mapProductReference = (
  product: unknown,
): PurchaseOrderDetail['items'][number]['product'] => {
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

const mapSummaryItems = (
  items: unknown,
): NonNullable<PurchaseOrderSummary['items']> => {
  if (!Array.isArray(items)) {
    return [];
  }

  const mapped: NonNullable<PurchaseOrderSummary['items']> = [];

  for (const item of items) {
    const candidate = item as Record<string, any> | undefined;
    const did = ensureString(candidate?.did);
    const dname = ensureString(candidate?.dname);

    if (!did || !dname) {
      continue;
    }

    mapped.push({
      _id: ensureString(candidate?._id),
      did,
      dname,
      dquantity: Number(candidate?.dquantity ?? 0),
      dtotalCost: Number(candidate?.dtotalCost ?? 0),
      unitPrice:
        candidate?.unitPrice === undefined || candidate?.unitPrice === null
          ? undefined
          : Number(candidate?.unitPrice),
    });
  }

  return mapped;
};

const mapDetailItems = (
  items: unknown,
  sourceItems: unknown[],
): PurchaseOrderDetail['items'] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item, index) => {
    const candidate = item as Record<string, any>;
    const fallbackSource = Array.isArray(sourceItems)
      ? (sourceItems[index] as Record<string, any> | undefined)
      : undefined;
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
      batchNumber: candidate.batchNumber ?? fallbackSource?.batchNumber ?? undefined,
      packageQuantity:
        candidate.packageQuantity === undefined || candidate.packageQuantity === null
          ? undefined
          : Number(candidate.packageQuantity),
      boxQuantity:
        candidate.boxQuantity === undefined || candidate.boxQuantity === null
          ? undefined
          : Number(candidate.boxQuantity),
      notes: candidate.notes ?? fallbackSource?.notes ?? undefined,
      product: mapProductReference(candidate.product ?? fallbackSource?.product),
    };
  });
};

export const toPurchaseOrderSummary = (
  order: IPurchaseOrderDocument,
): PurchaseOrderSummary => {
  const plain = toPlainOrder(order);
  const summaryCandidate: PurchaseOrderSummary = purchaseOrderSummarySchema.parse({
    _id: ensureString(plain._id)!,
    poid: plain.poid,
    orderNumber: plain.orderNumber,
    pobill: plain.pobill,
    pobilldate: ensureDateString(plain.pobilldate),
    posupplier: plain.posupplier,
    supplier: mapSupplierReference(plain.supplier),
    organizationId: ensureString(plain.organizationId),
    transactionType: ensureString(plain.transactionType),
    accountingEntryType: ensureString(plain.accountingEntryType),
    selectedAccountIds: mapSelectedAccountIds(plain.selectedAccountIds),
    relatedTransactionGroupId: ensureString(plain.relatedTransactionGroupId),
    totalAmount: Number(plain.totalAmount ?? 0),
    status: plain.status,
    paymentStatus: plain.paymentStatus,
    notes: plain.notes,
    createdAt: ensureDateString(plain.createdAt) ?? ensureDateString(plain.updatedAt),
    updatedAt: ensureDateString(plain.updatedAt) ?? ensureDateString(plain.createdAt),
    items: mapSummaryItems(plain.items),
  });

  return summaryCandidate;
};

export const toPurchaseOrderDetail = (
  order: IPurchaseOrderDocument,
): PurchaseOrderDetail => {
  const plain = toPlainOrder(order);
  const detailCandidate: PurchaseOrderDetail = purchaseOrderDetailSchema.parse({
    ...plain,
    _id: ensureString(plain._id)!,
    supplier: mapSupplierReference(plain.supplier),
    selectedAccountIds: mapSelectedAccountIds(plain.selectedAccountIds),
    organizationId: ensureString(plain.organizationId),
    transactionType: ensureString(plain.transactionType),
    accountingEntryType: ensureString(plain.accountingEntryType),
    paymentStatus: plain.paymentStatus,
    relatedTransactionGroupId: ensureString(plain.relatedTransactionGroupId),
    createdBy: plain.createdBy
      ? {
          ...plain.createdBy,
          _id: ensureString(plain.createdBy?._id),
        }
      : undefined,
    createdAt: ensureDateString(plain.createdAt) ?? new Date().toISOString(),
    updatedAt: ensureDateString(plain.updatedAt) ?? new Date().toISOString(),
    pobilldate: ensureDateString(plain.pobilldate),
    orderDate: ensureDateString(plain.orderDate),
    expectedDeliveryDate: ensureDateString(plain.expectedDeliveryDate),
    actualDeliveryDate: ensureDateString(plain.actualDeliveryDate),
    items: mapDetailItems(plain.items, (order.items as unknown[]) ?? []),
  });

  return detailCandidate;
};

export const toPurchaseOrderSummaries = (
  orders: IPurchaseOrderDocument[],
): PurchaseOrderSummary[] => orders.map((order) => toPurchaseOrderSummary(order));
