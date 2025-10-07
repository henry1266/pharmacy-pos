import { z } from 'zod'
import { zodId } from '../../utils/zodUtils'

const timestampSchema = z.union([z.string(), z.date()])

const emergencyContactSchema = z
  .object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  })
  .strict()

export const employeeSchema = z
  .object({
    _id: zodId,
    name: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    position: z.string().optional(),
    hireDate: timestampSchema.optional(),
    birthDate: timestampSchema.optional(),
    idNumber: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    department: z.string().optional(),
    salary: z.number().optional(),
    insuranceDate: timestampSchema.optional(),
    education: z.string().optional(),
    nativePlace: z.string().optional(),
    experience: z.string().optional(),
    rewards: z.string().optional(),
    injuries: z.string().optional(),
    additionalInfo: z.string().optional(),
    idCardFront: z.string().optional(),
    idCardBack: z.string().optional(),
    signDate: timestampSchema.optional(),
    emergencyContact: emergencyContactSchema.optional(),
    notes: z.string().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .passthrough()

export const employeeCreateSchema = employeeSchema
  .omit({
    _id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    name: z.string().min(1),
    gender: z.enum(['male', 'female', 'other']),
    birthDate: timestampSchema,
    idNumber: z.string().min(1),
    address: z.string().min(1),
    position: z.string().min(1),
    department: z.string().min(1),
    hireDate: timestampSchema,
    phone: z.string().min(1),
  })

export const employeeUpdateSchema = employeeCreateSchema.partial()

export const employeeAccountSchema = z
  .object({
    _id: zodId,
    employeeId: zodId,
    username: z.string(),
    email: z.string().optional(),
    role: z.string(),
    isActive: z.boolean(),
    lastLogin: timestampSchema.optional(),
    settings: z.record(z.unknown()).optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .passthrough()

export const employeeAccountCreateSchema = z
  .object({
    employeeId: zodId,
    username: z.string().min(1),
    email: z.string().email().optional(),
    role: z.string().min(1),
    password: z.string().min(6),
    isActive: z.boolean().optional(),
  })
  .passthrough()

export const employeeAccountUpdateSchema = z
  .object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    role: z.string().optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(6).optional(),
  })
  .passthrough()

export const employeeSearchSchema = z
  .object({
    search: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

export default {
  employeeSchema,
  employeeCreateSchema,
  employeeUpdateSchema,
  employeeAccountSchema,
  employeeAccountCreateSchema,
  employeeAccountUpdateSchema,
  employeeSearchSchema,
}
