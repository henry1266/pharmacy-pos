import type { z } from 'zod';
import type { Supplier as SupplierEntity } from '@pharmacy-pos/shared/types/entities';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierSearchSchema
} from '@pharmacy-pos/shared/dist/schemas/zod/supplier';

export type SupplierRecord = Record<string, any>;
export type SupplierResponse = SupplierEntity;

export type SupplierCreateInput = z.infer<typeof createSupplierSchema>;
export type SupplierUpdateInput = z.infer<typeof updateSupplierSchema>;
export type SupplierQueryInput = z.infer<typeof supplierSearchSchema>;

export type SupplierUpsertInput = SupplierCreateInput | SupplierUpdateInput;
