import { z } from 'zod';
import { VALIDATION_CONSTANTS } from '../../constants/index.js';

const nameSchema = z.string()
  .min(VALIDATION_CONSTANTS.CUSTOMER_NAME.MIN_LENGTH, { message: '客戶姓名長度需在 1-100 字之間' })
  .max(VALIDATION_CONSTANTS.CUSTOMER_NAME.MAX_LENGTH, { message: '客戶姓名長度需在 1-100 字之間' });

const phoneSchema = z.string()
  .regex(VALIDATION_CONSTANTS.PHONE.PATTERN, { message: '電話格式不正確' })
  .min(VALIDATION_CONSTANTS.PHONE.MIN_LENGTH, { message: '電話格式不正確' })
  .max(VALIDATION_CONSTANTS.PHONE.MAX_LENGTH, { message: '電話格式不正確' });

const emailSchema = z.string()
  .regex(VALIDATION_CONSTANTS.EMAIL.PATTERN, { message: '電子郵件格式不正確' })
  .max(VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH, { message: '電子郵件格式不正確' });

const idCardSchema = z.string()
  .regex(VALIDATION_CONSTANTS.ID_NUMBER.PATTERN, { message: '身分證格式不正確' });

const birthdateSchema = z.union([z.string(), z.date()]);

export const customerSchema = z.object({
  name: nameSchema,
  code: z.string().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: z.string().optional(),
  idCardNumber: idCardSchema.optional(),
  birthdate: birthdateSchema.optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  allergies: z.array(z.string()).optional(),
  membershipLevel: z.enum(['regular', 'silver', 'gold', 'platinum']).optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
  line: z.string().optional(),
});

export const createCustomerSchema = customerSchema;
export const updateCustomerSchema = customerSchema.partial();

export const customerSearchSchema = z.object({
  search: z.string().optional(),
  wildcardSearch: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const quickCreateCustomerSchema = z.object({
  name: nameSchema,
  birthdate: birthdateSchema,
  idCardNumber: idCardSchema,
  notes: z.string().optional(),
});

export default {
  customerSchema,
  createCustomerSchema,
  updateCustomerSchema,
  customerSearchSchema,
  quickCreateCustomerSchema,
};
