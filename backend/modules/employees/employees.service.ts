import mongoose from 'mongoose'
import { API_CONSTANTS, ERROR_MESSAGES, REGEX_PATTERNS } from '@pharmacy-pos/shared/constants'
import {
  employeeCreateSchema,
  employeeSchema,
  employeeSearchSchema,
  employeeUpdateSchema,
} from '@pharmacy-pos/shared/schemas/zod/employee'
import type { z } from 'zod'
import Employee from '../../models/Employee'

export type EmployeeRecord = z.infer<typeof employeeSchema>
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>
export type EmployeeSearchFilters = z.infer<typeof employeeSearchSchema>

export class EmployeeServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'EmployeeServiceError'
  }
}

const ID_NUMBER_REGEX = REGEX_PATTERNS?.TW_ID_NUMBER ?? new RegExp('^[A-Z][12]\d{8}$')

export async function listEmployees(filters: EmployeeSearchFilters = {} as EmployeeSearchFilters): Promise<EmployeeRecord[]> {
  const query: Record<string, unknown> = {}

  if (filters.search) {
    const regex = new RegExp(filters.search, 'i')
    query.$or = [
      { name: regex },
      { department: regex },
      { position: regex },
    ] as any
  }

  if (filters.department) {
    query.department = filters.department
  }

  if (filters.position) {
    query.position = filters.position
  }

  if (typeof filters.isActive === 'boolean') {
    query.userId = filters.isActive ? { $ne: null } : { $in: [null, undefined] }
  }

  const employees = await Employee.find(query as any).sort({ name: 1 }).lean()
  return employees.map((employee) => mapEmployee(employee))
}

export async function getEmployeeById(id: string): Promise<EmployeeRecord | null> {
  ensureValidObjectId(id)
  const employee = await Employee.findById(id).lean()
  if (!employee) {
    return null
  }
  return mapEmployee(employee)
}

export async function createEmployee(payload: EmployeeCreateInput, options: { createdByUserId?: string } = {}): Promise<EmployeeRecord> {
  const parsed = employeeCreateSchema.parse(payload)
  const normalizedIdNumber = await assertIdNumberAvailable(parsed.idNumber)

  const employee = new Employee({
    ...parsed,
    idNumber: normalizedIdNumber,
    birthDate: toDateOrUndefined(parsed.birthDate),
    hireDate: toDateOrUndefined(parsed.hireDate),
    insuranceDate: toDateOrUndefined(parsed.insuranceDate),
    signDate: toDateOrUndefined(parsed.signDate),
  }) as any

  if (options.createdByUserId) {
    employee.userId = new mongoose.Types.ObjectId(options.createdByUserId)
  }

  const saved = await employee.save()
  return mapEmployee(saved)
}

export async function updateEmployee(id: string, payload: EmployeeUpdateInput): Promise<EmployeeRecord | null> {
  ensureValidObjectId(id)
  const parsed = employeeUpdateSchema.parse(payload)
  const employee = await Employee.findById(id)
  if (!employee) {
    return null
  }

  if (parsed.idNumber !== undefined) {
    const normalizedIdNumber = await assertIdNumberAvailable(parsed.idNumber, id)
    employee.set('idNumber', normalizedIdNumber)
  }

  const updateFields = buildUpdatableFields(parsed)
  Object.entries(updateFields).forEach(([key, value]) => {
    employee.set(key, value)
  })

  const saved = await employee.save()
  return mapEmployee(saved)
}

export async function deleteEmployee(id: string): Promise<boolean> {
  ensureValidObjectId(id)
  const result = await Employee.findByIdAndDelete(id)
  return Boolean(result)
}

async function assertIdNumberAvailable(idNumber: string, currentId?: string): Promise<string> {
  const normalized = normalizeIdNumber(idNumber)
  if (!ID_NUMBER_REGEX.test(normalized)) {
    throw new EmployeeServiceError(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST, 'Invalid ID number format')
  }

  const query: Record<string, unknown> = { idNumber: normalized }
  if (currentId) {
    query._id = { $ne: new mongoose.Types.ObjectId(currentId) } as any
  }

  const existing = await Employee.findOne(query as any).lean()
  if (existing) {
    throw new EmployeeServiceError(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.GENERIC.DUPLICATE_ENTRY)
  }

  return normalized
}

function ensureValidObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new EmployeeServiceError(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.GENERIC.INVALID_ID)
  }
}

function mapEmployee(source: unknown): EmployeeRecord {
  const raw: any = typeof (source as any)?.toObject === 'function' ? (source as any).toObject() : (source as any)
  const base = {
    _id: raw._id?.toString() ?? '',
    name: raw.name ?? '',
    phone: raw.phone ?? undefined,
    email: raw.email ?? undefined,
    address: raw.address ?? undefined,
    position: raw.position ?? undefined,
    hireDate: raw.hireDate ?? undefined,
    birthDate: raw.birthDate ?? undefined,
    idNumber: raw.idNumber ?? undefined,
    gender: raw.gender ?? undefined,
    department: raw.department ?? undefined,
    salary: raw.salary ?? undefined,
    insuranceDate: raw.insuranceDate ?? undefined,
    education: raw.education ?? undefined,
    nativePlace: raw.nativePlace ?? undefined,
    experience: raw.experience ?? undefined,
    rewards: raw.rewards ?? undefined,
    injuries: raw.injuries ?? undefined,
    additionalInfo: raw.additionalInfo ?? undefined,
    idCardFront: raw.idCardFront ?? undefined,
    idCardBack: raw.idCardBack ?? undefined,
    signDate: raw.signDate ?? undefined,
    emergencyContact: normalizeEmergencyContact(raw.emergencyContact),
    notes: raw.notes ?? undefined,
    createdAt: raw.createdAt ?? new Date(),
    updatedAt: raw.updatedAt ?? new Date(),
  }

  return employeeSchema.parse(base)
}

function normalizeEmergencyContact(value: unknown): EmployeeRecord['emergencyContact'] {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  const contact = value as Record<string, unknown>
  const name = typeof contact.name === 'string' ? contact.name : undefined
  const phone = typeof contact.phone === 'string' ? contact.phone : undefined
  const relationship = typeof contact.relationship === 'string' ? contact.relationship : undefined
  if (!name || !phone || !relationship) {
    return undefined
  }
  return { name, phone, relationship }
}

function buildUpdatableFields(payload: EmployeeUpdateInput): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const assign = <K extends keyof EmployeeUpdateInput>(
    key: K,
    transformer?: (value: NonNullable<EmployeeUpdateInput[K]>) => unknown,
  ) => {
    const value = payload[key]
    if (value !== undefined) {
      result[key as string] = transformer
        ? transformer(value as NonNullable<EmployeeUpdateInput[K]>)
        : value
    }
  }

  assign('name')
  assign('gender')
  assign('birthDate', toDateOrUndefined)
  assign('idNumber', normalizeIdNumber)
  assign('education')
  assign('nativePlace')
  assign('address')
  assign('phone')
  assign('email')
  assign('position')
  assign('department')
  assign('hireDate', toDateOrUndefined)
  assign('salary')
  assign('insuranceDate', toDateOrUndefined)
  assign('experience')
  assign('rewards')
  assign('injuries')
  assign('additionalInfo')
  assign('idCardFront')
  assign('idCardBack')
  assign('signDate', toDateOrUndefined)
  assign('emergencyContact')
  assign('notes')

  return result
}

function toDateOrUndefined(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (value instanceof Date) {
    return value
  }

  const parsed = new Date(value as string)
  if (Number.isNaN(parsed.getTime())) {
    throw new EmployeeServiceError(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST, 'Invalid date value')
  }
  return parsed
}

function normalizeIdNumber(value: string): string {
  return value.trim()
}




