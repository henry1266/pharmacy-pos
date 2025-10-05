import { Router } from 'express'
import { initServer, createExpressEndpoints } from '@ts-rest/express'
import type { ServerInferRequest } from '@ts-rest/core'
import { employeesContract } from '@pharmacy-pos/shared/api/contracts'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
import {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  EmployeeServiceError,
} from './employees.service'
import { employeeAccountSchema } from '@pharmacy-pos/shared/schemas/zod/employee'
import {
  getEmployeeAccount as fetchEmployeeAccount,
  updateEmployeeAccount as persistEmployeeAccount,
} from '../../services/employeeAccountService'
import type { UpdateData } from '../../services/employeeAccountService'
import logger from '../../utils/logger'

const server = initServer()

type ListEmployeesRequest = ServerInferRequest<typeof employeesContract['listEmployees']>
type GetEmployeeRequest = ServerInferRequest<typeof employeesContract['getEmployeeById']>
type CreateEmployeeRequest = ServerInferRequest<typeof employeesContract['createEmployee']>
type UpdateEmployeeRequest = ServerInferRequest<typeof employeesContract['updateEmployee']>
type DeleteEmployeeRequest = ServerInferRequest<typeof employeesContract['deleteEmployee']>
type GetEmployeeAccountRequest = ServerInferRequest<typeof employeesContract['getEmployeeAccount']>
type UpdateEmployeeAccountRequest = ServerInferRequest<typeof employeesContract['updateEmployeeAccount']>

type KnownErrorStatus = 400 | 404 | 409 | 500

function toAccountUpdateData(body: UpdateEmployeeAccountRequest['body']): UpdateData {
  const payload: UpdateData = {}

  if (body.username !== undefined) {
    payload.username = body.username
  }
  if (body.email !== undefined) {
    payload.email = body.email
  }
  if (body.role !== undefined) {
    payload.role = body.role
  }
  if (body.isActive !== undefined) {
    payload.isActive = body.isActive
  }
  if (body.password !== undefined) {
    payload.password = body.password
  }

  return payload
}

const implementation = server.router(employeesContract, {
  listEmployees: async ({ query }: ListEmployeesRequest) => {
    try {
      const employees = await listEmployees(query ?? {})
      return successResponse(200, employees, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError(error, 'Failed to list employees', [500] as const) as any
    }
  },
  getEmployeeById: async ({ params }: GetEmployeeRequest) => {
    try {
      const employee = await getEmployeeById(params.id)
      if (!employee) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(200, employee, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError(error, 'Failed to get employee', [404, 500] as const) as any
    }
  },
  createEmployee: async ({ body }: CreateEmployeeRequest) => {
    try {
      const employee = await createEmployee(body)
      return successResponse(200, employee, SUCCESS_MESSAGES.GENERIC.CREATED)
    } catch (error) {
      return handleError(error, 'Failed to create employee', [400, 500] as const) as any
    }
  },
  updateEmployee: async ({ params, body }: UpdateEmployeeRequest) => {
    try {
      const employee = await updateEmployee(params.id, body)
      if (!employee) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(200, employee, SUCCESS_MESSAGES.GENERIC.UPDATED)
    } catch (error) {
      return handleError(error, 'Failed to update employee', [400, 404, 500] as const) as any
    }
  },
  deleteEmployee: async ({ params }: DeleteEmployeeRequest) => {
    try {
      const deleted = await deleteEmployee(params.id)
      if (!deleted) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(200, { id: params.id }, SUCCESS_MESSAGES.GENERIC.DELETED)
    } catch (error) {
      return handleError(error, 'Failed to delete employee', [404, 500] as const) as any
    }
  },
  getEmployeeAccount: async ({ params }: GetEmployeeAccountRequest) => {
    try {
      const account = await fetchEmployeeAccount(params.id)
      if (!account) {
        return errorResponse(404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(200, toAccountResponse(account, params.id), SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleAccountError(error, 'Failed to get employee account', [404, 500] as const) as any
    }
  },
  updateEmployeeAccount: async ({ params, body }: UpdateEmployeeAccountRequest) => {
    try {
      const account = await persistEmployeeAccount(params.id, toAccountUpdateData(body))
      return successResponse(200, toAccountResponse(account, params.id), SUCCESS_MESSAGES.GENERIC.UPDATED)
    } catch (error) {
      return handleAccountError(error, 'Failed to update employee account', [400, 404, 500] as const) as any
    }
  },
})

function successResponse<TStatus extends number>(status: TStatus, data: unknown, message: string) {
  return {
    status,
    body: {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  } as const
}

function errorResponse<TStatus extends KnownErrorStatus>(status: TStatus, message: string) {
  return {
    status,
    body: {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    },
  } as const
}

function toAccountResponse(account: any, employeeId: string) {
  const normalized = {
    _id: account._id?.toString() ?? account.id,
    employeeId,
    username: account.username,
    email: account.email ?? undefined,
    role: account.role,
    isActive: account.isActive ?? true,
    lastLogin: account.lastLogin ?? undefined,
    settings: account.settings ?? undefined,
    createdAt: account.createdAt ?? new Date(),
    updatedAt: account.updatedAt ?? new Date(),
  }
  return employeeAccountSchema.parse(normalized)
}

function mapServiceStatus(status: number): KnownErrorStatus {
  if (status === 404) return 404
  if (status === 400) return 400
  if (status === 409) return 409
  return 500
}

function handleError<Allowed extends KnownErrorStatus>(
  error: unknown,
  logMessage: string,
  allowedStatuses: readonly Allowed[],
) {
  const defaultStatus = (allowedStatuses.find((status) => status === 500) ?? allowedStatuses[0]) as Allowed

  if (error instanceof EmployeeServiceError) {
    const status = mapServiceStatus(error.status)
    const finalStatus = (allowedStatuses.includes(status as Allowed) ? status : defaultStatus) as Allowed
    return errorResponse(finalStatus, error.message)
  }

  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`)
  return errorResponse(defaultStatus, ERROR_MESSAGES.GENERIC.SERVER_ERROR)
}

function handleAccountError<Allowed extends KnownErrorStatus>(
  error: unknown,
  logMessage: string,
  allowedStatuses: readonly Allowed[],
) {
  const defaultStatus = (allowedStatuses.find((status) => status === 500) ?? allowedStatuses[0]) as Allowed

  if (error instanceof EmployeeServiceError) {
    const status = mapServiceStatus(error.status)
    const finalStatus = (allowedStatuses.includes(status as Allowed) ? status : defaultStatus) as Allowed
    return errorResponse(finalStatus, error.message)
  }

  if (error instanceof Error) {
    const message = error.message || ERROR_MESSAGES.GENERIC.SERVER_ERROR
    const lowered = message.toLowerCase()
    if (allowedStatuses.includes(404 as Allowed) && lowered.includes('not found')) {
      return errorResponse(404 as Allowed, message)
    }
    if (allowedStatuses.includes(400 as Allowed)) {
      return errorResponse(400 as Allowed, message)
    }
    return errorResponse(defaultStatus, message)
  }

  logger.error(`${logMessage}: ${String(error)}`)
  return errorResponse(defaultStatus, ERROR_MESSAGES.GENERIC.SERVER_ERROR)
}

const router: Router = Router()
createExpressEndpoints(employeesContract, implementation, router)

export default router








