import { z } from 'zod';

import {
  purchaseOrderSchema,
  purchaseOrderItemSchema,
} from '../zod/purchaseOrder';

/**
 * Summary schema represents the list view payload for purchase orders.
 * It keeps the core identifiers and status fields while allowing optional relational data.
 */
export const purchaseOrderSummarySchema = purchaseOrderSchema
  .pick({
    _id: true,
    poid: true,
    orderNumber: true,
    pobill: true,
    pobilldate: true,
    posupplier: true,
    supplier: true,
    organizationId: true,
    transactionType: true,
    accountingEntryType: true,
    selectedAccountIds: true,
    relatedTransactionGroupId: true,
    totalAmount: true,
    status: true,
    paymentStatus: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    supplier: purchaseOrderSchema.shape.supplier.optional(),
    organizationId: purchaseOrderSchema.shape.organizationId.optional(),
    transactionType: purchaseOrderSchema.shape.transactionType.optional(),
    accountingEntryType: purchaseOrderSchema.shape.accountingEntryType.optional(),
    selectedAccountIds: purchaseOrderSchema.shape.selectedAccountIds.optional(),
    relatedTransactionGroupId: purchaseOrderSchema.shape.relatedTransactionGroupId.optional(),
    paymentStatus: purchaseOrderSchema.shape.paymentStatus.optional(),
    pobill: purchaseOrderSchema.shape.pobill.optional(),
    pobilldate: purchaseOrderSchema.shape.pobilldate.optional(),
    notes: purchaseOrderSchema.shape.notes.optional(),
    items: z
      .array(
        purchaseOrderItemSchema.pick({
          _id: true,
          did: true,
          dname: true,
          dquantity: true,
          dtotalCost: true,
          unitPrice: true,
        }),
      )
      .optional(),
  })
  .strict();

/**
 * Detail schema keeps the exhaustive SSOT payload, mirroring backend responses.
 * We reuse the existing entity schema and expose it under a domain-specific name.
 */
export const purchaseOrderDetailSchema = purchaseOrderSchema;

export const purchaseOrderSummaryListSchema = z.array(purchaseOrderSummarySchema);

export type PurchaseOrderSummary = z.infer<typeof purchaseOrderSummarySchema>;
export type PurchaseOrderDetail = z.infer<typeof purchaseOrderDetailSchema>;

