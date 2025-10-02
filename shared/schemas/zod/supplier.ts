import { z } from 'zod';
import { VALIDATION_CONSTANTS } from '../../constants';

const supplierNameSchema = z
  .string()
  .min(VALIDATION_CONSTANTS.SUPPLIER_NAME.MIN_LENGTH, { message: 'Supplier name must be between 1 and 100 characters.' })
  .max(VALIDATION_CONSTANTS.SUPPLIER_NAME.MAX_LENGTH, { message: 'Supplier name must be between 1 and 100 characters.' });

const supplierCodeSchema = z
  .string()
  .min(1, { message: 'Supplier code must contain at least 1 character.' })
  .max(50, { message: 'Supplier code must not exceed 50 characters.' });

const supplierShortCodeSchema = z
  .string()
  .min(1, { message: 'Short code must contain at least 1 character.' })
  .max(20, { message: 'Short code must not exceed 20 characters.' });

const contactPersonSchema = z
  .string()
  .min(1, { message: 'Contact person must contain at least 1 character.' })
  .max(100, { message: 'Contact person must not exceed 100 characters.' });

const phoneSchema = z
  .string()
  .regex(VALIDATION_CONSTANTS.PHONE.PATTERN, { message: 'Phone format is invalid.' })
  .min(VALIDATION_CONSTANTS.PHONE.MIN_LENGTH, { message: 'Phone must be between 8 and 20 characters.' })
  .max(VALIDATION_CONSTANTS.PHONE.MAX_LENGTH, { message: 'Phone must be between 8 and 20 characters.' });

const emailSchema = z
  .string()
  .regex(VALIDATION_CONSTANTS.EMAIL.PATTERN, { message: 'Email format is invalid.' })
  .max(VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH, { message: 'Email must not exceed 254 characters.' });

const taxIdSchema = z
  .string()
  .regex(VALIDATION_CONSTANTS.TAX_ID.PATTERN, { message: 'Tax ID must be 8 numeric characters.' });

const addressSchema = z.string().max(200, { message: 'Address must not exceed 200 characters.' });
const paymentTermsSchema = z.string().max(200, { message: 'Payment terms must not exceed 200 characters.' });
const notesSchema = z.string().max(500, { message: 'Notes must not exceed 500 characters.' });

export const supplierSchema = z.object({
  name: supplierNameSchema,
  code: supplierCodeSchema.optional(),
  shortCode: supplierShortCodeSchema.optional(),
  contactPerson: contactPersonSchema.optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: addressSchema.optional(),
  taxId: taxIdSchema.optional(),
  paymentTerms: paymentTermsSchema.optional(),
  notes: notesSchema.optional(),
  isActive: z.boolean().optional()
});

export const createSupplierSchema = supplierSchema;
export const updateSupplierSchema = supplierSchema.partial();

export const supplierSearchSchema = z.object({
  search: z.string().optional(),
  active: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export default {
  supplierSchema,
  createSupplierSchema,
  updateSupplierSchema,
  supplierSearchSchema
};
