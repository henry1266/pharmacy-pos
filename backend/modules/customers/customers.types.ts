
import type { z } from 'zod';
import type { Customer as CustomerEntity } from '@pharmacy-pos/shared/types/entities';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerSearchSchema,
} from '@pharmacy-pos/shared/dist/schemas/zod/customer';

export type CustomerRecord = Record<string, any>;
export type CustomerResponse = CustomerEntity;

export type CustomerCreateInput = z.infer<typeof createCustomerSchema>;
export type CustomerUpdateInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerSearchSchema>;

export type ExtendedCustomerInput = (CustomerCreateInput | CustomerUpdateInput) & {
  /** Legacy support for alternate note field name */
  note?: string;
  /** Legacy alias for birthdate */
  dateOfBirth?: string | Date | null;
  /** Legacy points field */
  points?: number | null;
  /** Legacy isActive flag */
  isActive?: boolean;
};
