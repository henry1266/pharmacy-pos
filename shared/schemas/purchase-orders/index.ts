import { z } from 'zod';

import {
  purchaseOrderSchema,
  purchaseOrderItemSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  purchaseOrderRecentQuerySchema,
  purchaseOrderSupplierParamsSchema,
  purchaseOrderProductParamsSchema,
} from '../zod/purchaseOrder';
import { apiErrorResponseSchema, createApiResponseSchema } from '../zod/common';

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

export const purchaseOrderCreateInputSchema = createPurchaseOrderSchema;
export const purchaseOrderUpdateInputSchema = updatePurchaseOrderSchema;

export const buildCreatePurchaseOrderPayload = (input: unknown) =>
  purchaseOrderCreateInputSchema.parse(input);

export const buildUpdatePurchaseOrderPayload = (input: unknown) =>
  purchaseOrderUpdateInputSchema.parse(input);

export const purchaseOrderMutationResponseSchema = createApiResponseSchema(purchaseOrderDetailSchema);

export const purchaseOrderDeleteResponseSchema = createApiResponseSchema(
  z.object({
    id: z.string(),
  }),
);

export const purchaseOrderFilteredListResponseSchema = createApiResponseSchema(purchaseOrderSummaryListSchema);

export const purchaseOrderRecentQueryFilterSchema = purchaseOrderRecentQuerySchema;
export const purchaseOrderSupplierFilterSchema = purchaseOrderSupplierParamsSchema;
export const purchaseOrderProductFilterSchema = purchaseOrderProductParamsSchema;

export const purchaseOrderErrorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'CONFLICT',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'SERVER_ERROR',
]);

export const purchaseOrderErrorSchema = apiErrorResponseSchema
  .extend({
    code: purchaseOrderErrorCodeSchema,
    statusCode: z.union([
      z.literal(400),
      z.literal(401),
      z.literal(403),
      z.literal(404),
      z.literal(409),
      z.literal(500),
    ]),
    details: z
      .object({
        fields: z.record(z.array(z.string())).optional(),
        entityId: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export type PurchaseOrderCreateInput = z.infer<typeof purchaseOrderCreateInputSchema>;
export type PurchaseOrderUpdateInput = z.infer<typeof purchaseOrderUpdateInputSchema>;
export type PurchaseOrderMutationResponse = z.infer<typeof purchaseOrderMutationResponseSchema>;
export type PurchaseOrderDeleteResponse = z.infer<typeof purchaseOrderDeleteResponseSchema>;
export type PurchaseOrderError = z.infer<typeof purchaseOrderErrorSchema>;

