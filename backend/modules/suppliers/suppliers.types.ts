import type { z } from 'zod';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierSearchSchema,
  supplierEntitySchema,
} from '@pharmacy-pos/shared/schemas/zod/supplier';

export type SupplierRecord = Record<string, any>;
export type SupplierResponse = z.infer<typeof supplierEntitySchema>;

export type SupplierCreateInput = z.infer<typeof createSupplierSchema>;
export type SupplierUpdateInput = z.infer<typeof updateSupplierSchema>;
export type SupplierQueryInput = z.infer<typeof supplierSearchSchema>;

export type SupplierUpsertInput = SupplierCreateInput | SupplierUpdateInput;
