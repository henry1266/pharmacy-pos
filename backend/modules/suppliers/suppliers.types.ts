import type {
  CreateSupplierInput,
  SupplierEntity,
  SupplierSearchInput,
  UpdateSupplierInput,
} from '@pharmacy-pos/shared/schemas/zod/supplier';

export type SupplierRecord = Record<string, any>;
export type SupplierResponse = SupplierEntity;

export type SupplierCreateInput = CreateSupplierInput;
export type SupplierUpdateInput = UpdateSupplierInput;
export type SupplierQueryInput = SupplierSearchInput;

export type SupplierUpsertInput = SupplierCreateInput | SupplierUpdateInput;
