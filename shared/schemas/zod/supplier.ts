import { z } from 'zod';
import { zodId } from '../../utils/zodUtils';
import { VALIDATION_CONSTANTS } from '../../constants';

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
    schema.optional()
  );

const supplierNameSchema = z
  .string()
  .trim()
  .min(VALIDATION_CONSTANTS.SUPPLIER_NAME.MIN_LENGTH, { message: 'Supplier name must be between 1 and 100 characters.' })
  .max(VALIDATION_CONSTANTS.SUPPLIER_NAME.MAX_LENGTH, { message: 'Supplier name must be between 1 and 100 characters.' });

const supplierCodeSchema = optionalTrimmedString(
  z
    .string()
    .min(1, { message: 'Supplier code must contain at least 1 character.' })
    .max(50, { message: 'Supplier code must not exceed 50 characters.' })
);

const supplierShortCodeSchema = optionalTrimmedString(
  z
    .string()
    .min(1, { message: 'Short code must contain at least 1 character.' })
    .max(20, { message: 'Short code must not exceed 20 characters.' })
);

const contactPersonSchema = optionalTrimmedString(
  z
    .string()
    .min(1, { message: 'Contact person must contain at least 1 character.' })
    .max(100, { message: 'Contact person must not exceed 100 characters.' })
);

const phoneSchema = optionalTrimmedString(
  z
    .string()
    .regex(VALIDATION_CONSTANTS.PHONE.PATTERN, { message: 'Phone format is invalid.' })
    .min(VALIDATION_CONSTANTS.PHONE.MIN_LENGTH, { message: 'Phone must be between 8 and 20 characters.' })
    .max(VALIDATION_CONSTANTS.PHONE.MAX_LENGTH, { message: 'Phone must be between 8 and 20 characters.' })
);

const emailSchema = optionalTrimmedString(
  z
    .string()
    .max(VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH, { message: 'Email must not exceed 254 characters.' })
);

const taxIdSchema = optionalTrimmedString(
  z
    .string()
    .regex(VALIDATION_CONSTANTS.TAX_ID.PATTERN, { message: 'Tax ID must be 8 numeric characters.' })
);

const addressSchema = z.string().max(200, { message: 'Address must not exceed 200 characters.' });
const paymentTermsSchema = z.string().max(200, { message: 'Payment terms must not exceed 200 characters.' });
const notesSchema = z.string().max(500, { message: 'Notes must not exceed 500 characters.' });

const timestampSchema = z.union([z.string(), z.date()]);

export const supplierSchema = z.object({
  name: supplierNameSchema,
  code: supplierCodeSchema,
  shortCode: supplierShortCodeSchema,
  contactPerson: contactPersonSchema,
  phone: phoneSchema,
  email: emailSchema,
  address: addressSchema.optional(),
  taxId: taxIdSchema,
  paymentTerms: paymentTermsSchema.optional(),
  notes: notesSchema.optional(),
  isActive: z.boolean().optional(),
});

export const createSupplierSchema = supplierSchema;
export const updateSupplierSchema = supplierSchema.partial();

export const supplierSearchSchema = z.object({
  search: z.string().optional(),
  active: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
}).passthrough();

export const supplierEntitySchema = supplierSchema
  .extend({
    _id: zodId,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    date: timestampSchema.optional(),
  })
  .passthrough();

export default {
  supplierSchema,
  supplierEntitySchema,
  createSupplierSchema,
  updateSupplierSchema,
  supplierSearchSchema,
};
