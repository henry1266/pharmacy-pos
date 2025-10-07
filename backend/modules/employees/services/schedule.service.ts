import mongoose from 'mongoose'
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
import {
  employeeScheduleSchema,
  employeeScheduleCreateSchema,
  employeeScheduleUpdateSchema,
  employeeScheduleQuerySchema,
  employeeScheduleByDateQuerySchema,
  employeeSchedulesByDateSchema,
} from '@pharmacy-pos/shared/schemas/zod/employeeSchedule'
import type { z } from 'zod'
import EmployeeSchedule from '../models/EmployeeSchedule'
import Employee from '../models/Employee'

export type EmployeeScheduleRecord = z.infer<typeof employeeScheduleSchema>
export type EmployeeScheduleCreateInput = z.infer<typeof employeeScheduleCreateSchema>
export type EmployeeScheduleUpdateInput = z.infer<typeof employeeScheduleUpdateSchema>
export type EmployeeScheduleFilters = z.infer<typeof employeeScheduleQuerySchema>
export type EmployeeScheduleByDateFilters = z.infer<typeof employeeScheduleByDateQuerySchema>
export type EmployeeSchedulesByDate = z.infer<typeof employeeSchedulesByDateSchema>

export class EmployeeScheduleServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'EmployeeScheduleServiceError'
  }
}

export async function listSchedules(
  filters: EmployeeScheduleFilters = {} as EmployeeScheduleFilters,
): Promise<EmployeeScheduleRecord[]> {
  const parsed = employeeScheduleQuerySchema.parse(filters)
  const query: Record<string, unknown> = {}

  if ((parsed.startDate && !parsed.endDate) || (!parsed.startDate && parsed.endDate)) {
    throw new EmployeeScheduleServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      'Both startDate and endDate are required when filtering by date range',
    )
  }

  if (parsed.startDate && parsed.endDate) {
    const { start, end } = buildDateRange(parsed.startDate, parsed.endDate)
    query.date = { $gte: start, $lte: end }
  }

  if (parsed.employeeId) {
    query.employeeId = new mongoose.Types.ObjectId(parsed.employeeId)
  }

  if (parsed.leaveType) {
    query.leaveType = parsed.leaveType
  }

  const schedules = await EmployeeSchedule.find(query)
    .populate('employeeId', 'name department position')
    .sort({ date: 1, shift: 1 })
    .lean()

  return schedules.map(mapSchedule)
}

export async function getSchedulesByDate(range: EmployeeScheduleByDateFilters): Promise<EmployeeSchedulesByDate> {
  const parsed = employeeScheduleByDateQuerySchema.parse(range)
  const { start, end } = buildDateRange(parsed.startDate, parsed.endDate)

  const schedules = await EmployeeSchedule.find({
    date: { $gte: start, $lte: end },
  })
    .populate('employeeId', 'name department position')
    .sort({ date: 1, shift: 1 })
    .lean()

  const grouped: Record<string, { morning: EmployeeScheduleRecord[]; afternoon: EmployeeScheduleRecord[]; evening: EmployeeScheduleRecord[] }> = {}

  schedules.forEach((schedule) => {
    const mapped = mapSchedule(schedule)
    const dateKey = toDateKey(mapped.date)

    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        morning: [],
        afternoon: [],
        evening: [],
      }
    }

    grouped[dateKey][mapped.shift].push(mapped)
  })

  return employeeSchedulesByDateSchema.parse(grouped)
}

export async function createSchedule(
  payload: EmployeeScheduleCreateInput,
  options: { createdByUserId?: string } = {},
): Promise<EmployeeScheduleRecord> {
  const parsed = employeeScheduleCreateSchema.parse(payload)
  const employeeId = new mongoose.Types.ObjectId(parsed.employeeId)
  await assertEmployeeExists(employeeId)

  const scheduleDate = toDate(parsed.date)
  await assertScheduleAvailable({
    date: scheduleDate,
    shift: parsed.shift,
    employeeId,
  })

  const created = await EmployeeSchedule.create({
    date: scheduleDate,
    shift: parsed.shift,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    leaveType: parsed.leaveType ?? null,
    employeeId,
    createdBy: options.createdByUserId ? new mongoose.Types.ObjectId(options.createdByUserId) : undefined,
  })

  const populated = await EmployeeSchedule.findById(created._id)
    .populate('employeeId', 'name department position')
    .lean()

  return mapSchedule(populated)
}

export async function updateSchedule(
  id: string,
  payload: EmployeeScheduleUpdateInput,
): Promise<EmployeeScheduleRecord | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new EmployeeScheduleServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.GENERIC.INVALID_ID,
    )
  }

  const parsed = employeeScheduleUpdateSchema.parse(payload)
  const schedule = await EmployeeSchedule.findById(id)

  if (!schedule) {
    return null
  }

  let employeeId = schedule.employeeId as mongoose.Types.ObjectId
  if (parsed.employeeId) {
    employeeId = new mongoose.Types.ObjectId(parsed.employeeId)
    await assertEmployeeExists(employeeId)
    schedule.employeeId = employeeId
  }

  if (parsed.date) {
    schedule.date = toDate(parsed.date)
  }

  if (parsed.shift) {
    schedule.shift = parsed.shift
  }

  if (parsed.startTime !== undefined) {
    schedule.set('startTime', parsed.startTime)
  }

  if (parsed.endTime !== undefined) {
    schedule.set('endTime', parsed.endTime)
  }

  if (parsed.leaveType !== undefined) {
    schedule.leaveType = parsed.leaveType ?? null
  }

  await assertScheduleAvailable({
    id,
    date: schedule.date,
    shift: schedule.shift,
    employeeId,
  })

  await schedule.save()

  const populated = await EmployeeSchedule.findById(schedule._id)
    .populate('employeeId', 'name department position')
    .lean()

  return mapSchedule(populated)
}

export async function deleteSchedule(id: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new EmployeeScheduleServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.GENERIC.INVALID_ID,
    )
  }

  const schedule = await EmployeeSchedule.findById(id)
  if (!schedule) {
    return false
  }

  await schedule.deleteOne()
  return true
}

function mapSchedule(source: unknown): EmployeeScheduleRecord {
  if (!source) {
    throw new EmployeeScheduleServiceError(
      API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.GENERIC.SERVER_ERROR,
    )
  }

  const raw: any = typeof (source as any)?.toObject === 'function' ? (source as any).toObject() : source
  const employee = normalizeEmployee(raw.employeeId)
  const employeeId = extractEmployeeId(raw.employeeId)

  const base = {
    _id: raw._id?.toString() ?? '',
    date: raw.date ?? new Date(),
    shift: raw.shift,
    startTime: raw.startTime ?? undefined,
    endTime: raw.endTime ?? undefined,
    employeeId,
    employee,
    leaveType: raw.leaveType ?? null,
    createdBy: extractEmployeeId(raw.createdBy),
    createdAt: raw.createdAt ?? new Date(),
    updatedAt: raw.updatedAt ?? new Date(),
  }

  return employeeScheduleSchema.parse(base)
}

async function assertEmployeeExists(employeeId: mongoose.Types.ObjectId): Promise<void> {
  const exists = await Employee.exists({ _id: employeeId })
  if (!exists) {
    throw new EmployeeScheduleServiceError(
      API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.GENERIC.NOT_FOUND,
    )
  }
}

async function assertScheduleAvailable(args: {
  id?: string
  date: Date
  shift: string
  employeeId: mongoose.Types.ObjectId
}): Promise<void> {
  const query: Record<string, unknown> = {
    date: args.date,
    shift: args.shift,
    employeeId: args.employeeId,
  }

  if (args.id) {
    query._id = { $ne: new mongoose.Types.ObjectId(args.id) }
  }

  const conflict = await EmployeeSchedule.exists(query)
  if (conflict) {
    throw new EmployeeScheduleServiceError(
      API_CONSTANTS.HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
    )
  }
}

function buildDateRange(startDate: string, endDate: string): { start: Date; end: Date } {
  const start = toDate(startDate)
  const end = toDate(endDate)

  if (start > end) {
    throw new EmployeeScheduleServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      'startDate must be less than or equal to endDate',
    )
  }

  return { start, end }
}

function toDate(input: string | Date): Date {
  const value = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(value.getTime())) {
    throw new EmployeeScheduleServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      'Invalid date value',
    )
  }
  return value
}

function toDateKey(input: string | Date): string {
  const date = toDate(input)
  return date.toISOString().split('T')[0]
}

function extractEmployeeId(value: unknown): string | undefined {
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    return value
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString()
  }

  if (typeof value === 'object' && value !== null && '_id' in (value as Record<string, unknown>)) {
    const id = (value as Record<string, unknown>)._id
    if (typeof id === 'string') {
      return id
    }
    if (id instanceof mongoose.Types.ObjectId) {
      return id.toString()
    }
  }

  return undefined
}

function normalizeEmployee(value: unknown): EmployeeScheduleRecord['employee'] {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const id = extractEmployeeId(value)
  if (!id) {
    return undefined
  }

  const record = value as Record<string, unknown>
  const name = typeof record.name === 'string' ? record.name : ''
  const department = typeof record.department === 'string' ? record.department : undefined
  const position = typeof record.position === 'string' ? record.position : undefined

  return {
    _id: id,
    name,
    department,
    position,
  }
}

