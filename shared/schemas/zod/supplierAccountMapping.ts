import { z } from 'zod';
import { zodId } from '../../utils/zodUtils';
import { createApiResponseSchema } from './common';

const optionalTrimmedString = (schema: z.ZodString) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) {
        return undefined;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }
      return value;
    },
    schema.optional(),
  );

const optionalNameString = z.string().trim().min(1).max(200);

const supplierAccountMappingAccountDetailSchema = z.object({
  _id: zodId,
  code: z.string().trim().min(1).max(50),
  name: optionalNameString,
  accountType: optionalTrimmedString(z.string().max(50)),
  organizationId: zodId.optional(),
  parentId: zodId.optional(),
}).partial({
  accountType: true,
  organizationId: true,
  parentId: true,
});

export const supplierAccountMappingItemSchema = z.object({
  accountId: zodId,
  accountCode: z.string().trim().min(1).max(50),
  accountName: z.string().trim().min(1).max(200),
  isDefault: z.boolean(),
  priority: z.number().int().min(0),
  account: supplierAccountMappingAccountDetailSchema.optional(),
});

export const supplierAccountMappingSchema = z.object({
  supplierId: zodId,
  supplierName: optionalNameString,
  organizationId: zodId,
  organizationName: optionalTrimmedString(optionalNameString),
  accountMappings: z.array(supplierAccountMappingItemSchema).min(1),
  isActive: z.boolean(),
  notes: optionalTrimmedString(z.string().max(500)),
  createdBy: optionalTrimmedString(z.string().max(100)),
  updatedBy: optionalTrimmedString(z.string().max(100)),
});

export const supplierAccountMappingEntitySchema = supplierAccountMappingSchema.extend({
  _id: zodId,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).strict();

export const supplierAccountMappingListQuerySchema = z
  .object({
    organizationId: zodId.optional(),
    supplierId: zodId.optional(),
  })
  .strict();

export const supplierAccountMappingBySupplierQuerySchema = z
  .object({
    organizationId: zodId.optional(),
  })
  .strict();

export const createSupplierAccountMappingSchema = z.object({
  supplierId: zodId,
  accountIds: z.array(zodId).min(1),
  notes: optionalTrimmedString(z.string().max(500)),
});

export const updateSupplierAccountMappingSchema = z.object({
  accountIds: z.array(zodId).min(1),
  notes: optionalTrimmedString(z.string().max(500)),
  isActive: z.boolean().optional(),
});

export const supplierAccountMappingEnvelopeSchema = createApiResponseSchema(
  supplierAccountMappingEntitySchema.nullable(),
);

export const supplierAccountMappingListEnvelopeSchema = createApiResponseSchema(
  z.array(supplierAccountMappingEntitySchema),
);

export const supplierAccountMappingDeleteEnvelopeSchema = createApiResponseSchema(z.null());

export type SupplierAccountMappingItem = z.infer<typeof supplierAccountMappingItemSchema>;
export type SupplierAccountMapping = z.infer<typeof supplierAccountMappingEntitySchema>;
export type SupplierAccountMappingListQuery = z.infer<typeof supplierAccountMappingListQuerySchema>;
export type SupplierAccountMappingBySupplierQuery = z.infer<typeof supplierAccountMappingBySupplierQuerySchema>;
export type SupplierAccountMappingCreateInput = z.infer<typeof createSupplierAccountMappingSchema>;
export type SupplierAccountMappingUpdateInput = z.infer<typeof updateSupplierAccountMappingSchema>;
