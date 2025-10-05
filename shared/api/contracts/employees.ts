import { initContract } from '@ts-rest/core'
import {
  employeeSchema,
  employeeCreateSchema,
  employeeUpdateSchema,
  employeeSearchSchema,
  employeeAccountSchema,
  employeeAccountUpdateSchema,
} from '../../schemas/zod/employee'
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
  z.object({ msg: z.string().optional() }).passthrough(),
)
const employeeAccountResponseSchema = createApiResponseSchema(employeeAccountSchema).or(employeeAccountSchema)

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
    path: '/employees/:id/account',
    pathParams: z.object({ id: zodId }),
    responses: {
      200: employeeAccountResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Get employee account',
      tags: ['Employees'],
    },
  },
  updateEmployeeAccount: {
    method: 'PUT',
    path: '/employees/:id/account',
    pathParams: z.object({ id: zodId }),
    body: employeeAccountUpdateSchema,
    responses: {
      200: employeeAccountResponseSchema,
      400: apiErrorResponseSchema,
      404: apiErrorResponseSchema,
      500: apiErrorResponseSchema,
    },
    metadata: {
      summary: 'Update employee account',
      tags: ['Employees'],
    },
  },
})

export type EmployeesContract = typeof employeesContract
