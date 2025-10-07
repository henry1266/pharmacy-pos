import { initContract } from '@ts-rest/core'
import {
  employeeSchema,
  employeeCreateSchema,
  employeeUpdateSchema,
  employeeSearchSchema,
  employeeAccountSchema,
  employeeAccountCreateSchema,
  employeeAccountUpdateSchema,
} from '../../schemas/zod/employee'
import {
  employeeScheduleSchema,
  employeeScheduleCreateSchema,
  employeeScheduleUpdateSchema,
  employeeScheduleQuerySchema,
  employeeScheduleByDateQuerySchema,
  employeeSchedulesByDateSchema,
} from '../../schemas/zod/employeeSchedule'
import {
  apiErrorResponseSchema,
  createApiResponseSchema,
} from '../../schemas/zod/common'
import { zodId } from '../../utils/zodUtils'
import { z } from 'zod'

const c = initContract()

const employeeResponseSchema = createApiResponseSchema(employeeSchema).or(employeeSchema)
const employeeListResponseSchema = createApiResponseSchema(z.array(employeeSchema)).or(z.array(employeeSchema))
const employeeDeleteResponseSchema = createApiResponseSchema(z.object({ id: zodId }).partial()).or(
  z.object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  }).passthrough(),
)

const employeeAccountResponseSchema = createApiResponseSchema(employeeAccountSchema).or(employeeAccountSchema)
const employeeAccountDeleteResponseSchema = createApiResponseSchema(
  z.object({
    id: zodId.optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
  }).passthrough(),
).or(
  z.object({
    id: zodId.optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
  }).passthrough(),
)

const employeeAccountUnbindResponseSchema = createApiResponseSchema(
  z.object({
    employeeId: zodId,
    unbound: z.boolean(),
    userId: zodId.optional(),
  }),
).or(
  z.object({
    employeeId: zodId,
    unbound: z.boolean(),
    userId: zodId.optional(),
  }),
)

const employeeScheduleResponseSchema = createApiResponseSchema(employeeScheduleSchema).or(employeeScheduleSchema)
const employeeScheduleListResponseSchema = createApiResponseSchema(z.array(employeeScheduleSchema)).or(
  z.array(employeeScheduleSchema),
)
const employeeScheduleGroupedResponseSchema = createApiResponseSchema(employeeSchedulesByDateSchema).or(
  employeeSchedulesByDateSchema,
)
const employeeScheduleDeleteResponseSchema = createApiResponseSchema(
  z.object({
    id: zodId.optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
  }).passthrough(),
).or(
  z.object({
    id: zodId.optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
  }).passthrough(),
)

export const employeesContract = c.router({
  listEmployees: {
    method: 'GET',
    path: '/employees',
    query: employeeSearchSchema.optional(),
    responses: {
      200: employeeListResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List employees',
      tags: ['Employees'],
    },
  },
  getEmployeeById: {
    method: 'GET',
    path: '/employees/:id',
    pathParams: z.object({ id: zodId }),
    responses: {
      200: employeeResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get employee detail',
      tags: ['Employees'],
    },
  },
  createEmployee: {
    method: 'POST',
    path: '/employees',
    body: employeeCreateSchema,
    responses: {
      200: employeeResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create employee',
      tags: ['Employees'],
    },
  },
  updateEmployee: {
    method: 'PUT',
    path: '/employees/:id',
    pathParams: z.object({ id: zodId }),
    body: employeeUpdateSchema,
    responses: {
      200: employeeResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update employee',
      tags: ['Employees'],
    },
  },
  deleteEmployee: {
    method: 'DELETE',
    path: '/employees/:id',
    pathParams: z.object({ id: zodId }),
    responses: {
      200: employeeDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete employee',
      tags: ['Employees'],
    },
  },
  getEmployeeAccount: {
    method: 'GET',
    path: '/employee-accounts/:employeeId',
    pathParams: z.object({ employeeId: zodId }),
    responses: {
      200: employeeAccountResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get employee account',
      tags: ['Employees', 'Accounts'],
    },
  },
  createEmployeeAccount: {
    method: 'POST',
    path: '/employee-accounts',
    body: employeeAccountCreateSchema,
    responses: {
      200: employeeAccountResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      409: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create employee account',
      tags: ['Employees', 'Accounts'],
    },
  },
  updateEmployeeAccount: {
    method: 'PUT',
    path: '/employee-accounts/:employeeId',
    pathParams: z.object({ employeeId: zodId }),
    body: employeeAccountUpdateSchema,
    responses: {
      200: employeeAccountResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      409: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update employee account',
      tags: ['Employees', 'Accounts'],
    },
  },
  deleteEmployeeAccount: {
    method: 'DELETE',
    path: '/employee-accounts/:employeeId',
    pathParams: z.object({ employeeId: zodId }),
    responses: {
      200: employeeAccountDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete employee account',
      tags: ['Employees', 'Accounts'],
    },
  },
  unbindEmployeeAccount: {
    method: 'PUT',
    path: '/employee-accounts/:employeeId/unbind',
    pathParams: z.object({ employeeId: zodId }),
    body: z.undefined(),
    responses: {
      200: employeeAccountUnbindResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Unbind employee account',
      tags: ['Employees', 'Accounts'],
    },
  },
  listEmployeeSchedules: {
    method: 'GET',
    path: '/employee-schedules',
    query: employeeScheduleQuerySchema.optional(),
    responses: {
      200: employeeScheduleListResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'List employee schedules',
      tags: ['Employees', 'Schedules'],
    },
  },
  createEmployeeSchedule: {
    method: 'POST',
    path: '/employee-schedules',
    body: employeeScheduleCreateSchema,
    responses: {
      200: employeeScheduleResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      409: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Create employee schedule',
      tags: ['Employees', 'Schedules'],
    },
  },
  updateEmployeeSchedule: {
    method: 'PUT',
    path: '/employee-schedules/:scheduleId',
    pathParams: z.object({ scheduleId: zodId }),
    body: employeeScheduleUpdateSchema,
    responses: {
      200: employeeScheduleResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      409: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update employee schedule',
      tags: ['Employees', 'Schedules'],
    },
  },
  deleteEmployeeSchedule: {
    method: 'DELETE',
    path: '/employee-schedules/:scheduleId',
    pathParams: z.object({ scheduleId: zodId }),
    responses: {
      200: employeeScheduleDeleteResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Delete employee schedule',
      tags: ['Employees', 'Schedules'],
    },
  },
  getEmployeeSchedulesByDate: {
    method: 'GET',
    path: '/employee-schedules/by-date',
    query: employeeScheduleByDateQuerySchema,
    responses: {
      200: employeeScheduleGroupedResponseSchema,
      400: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get employee schedules grouped by date',
      tags: ['Employees', 'Schedules'],
    },
  },
})

export type EmployeesContract = typeof employeesContract
