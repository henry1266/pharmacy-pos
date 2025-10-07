import { z } from 'zod'
import { zodId } from '../../utils/zodUtils'

const timestampValueSchema = z.union([z.string(), z.date()])
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const employeeScheduleShiftSchema = z.enum(['morning', 'afternoon', 'evening'])
export const employeeScheduleLeaveTypeSchema = z.enum(['sick', 'personal', 'overtime'])

export const employeeScheduleEmployeeSchema = z
  .object({
    _id: zodId,
    name: z.string(),
    department: z.string().optional(),
    position: z.string().optional(),
  })
  .passthrough()

export const employeeScheduleSchema = z
  .object({
    _id: zodId,
    date: timestampValueSchema,
    shift: employeeScheduleShiftSchema,
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    employeeId: zodId,
    employee: employeeScheduleEmployeeSchema.optional(),
    leaveType: employeeScheduleLeaveTypeSchema.nullable().optional(),
    createdBy: zodId.optional(),
    createdAt: timestampValueSchema,
    updatedAt: timestampValueSchema,
  })
  .passthrough()

export const employeeScheduleCreateSchema = z
  .object({
    date: dateStringSchema,
    shift: employeeScheduleShiftSchema,
    employeeId: zodId,
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    leaveType: employeeScheduleLeaveTypeSchema.nullable().optional(),
  })
  .passthrough()

export const employeeScheduleUpdateSchema = employeeScheduleCreateSchema.partial()

export const employeeScheduleQuerySchema = z
  .object({
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
    employeeId: zodId.optional(),
    leaveType: employeeScheduleLeaveTypeSchema.optional(),
  })
  .passthrough()

export const employeeScheduleByDateQuerySchema = z
  .object({
    startDate: dateStringSchema,
    endDate: dateStringSchema,
  })
  .passthrough()

export const employeeSchedulesByDateSchema = z.record(
  z.object({
    morning: z.array(employeeScheduleSchema),
    afternoon: z.array(employeeScheduleSchema),
    evening: z.array(employeeScheduleSchema),
  }),
)

export default {
  employeeScheduleSchema,
  employeeScheduleCreateSchema,
  employeeScheduleUpdateSchema,
  employeeScheduleQuerySchema,
  employeeScheduleByDateQuerySchema,
  employeeSchedulesByDateSchema,
  employeeScheduleShiftSchema,
  employeeScheduleLeaveTypeSchema,
  employeeScheduleEmployeeSchema,
}
