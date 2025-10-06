import { Router } from 'express'
import { initServer, createExpressEndpoints } from '@ts-rest/express'
import type { ServerInferRequest, ServerInferResponseBody } from '@ts-rest/core'
import { employeesContract } from '@pharmacy-pos/shared/api/contracts'
import { API_CONSTANTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
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
import { createValidationErrorHandler } from '../common/tsRest'
import { ZodError } from 'zod'

const server = initServer()

type ListEmployeesRequest = ServerInferRequest<typeof employeesContract['listEmployees']>
type GetEmployeeRequest = ServerInferRequest<typeof employeesContract['getEmployeeById']>
type CreateEmployeeRequest = ServerInferRequest<typeof employeesContract['createEmployee']>
type UpdateEmployeeRequest = ServerInferRequest<typeof employeesContract['updateEmployee']>
type DeleteEmployeeRequest = ServerInferRequest<typeof employeesContract['deleteEmployee']>
type GetEmployeeAccountRequest = ServerInferRequest<typeof employeesContract['getEmployeeAccount']>
type UpdateEmployeeAccountRequest = ServerInferRequest<typeof employeesContract['updateEmployeeAccount']>

type EmployeesContract = typeof employeesContract
type RouteKey = keyof EmployeesContract
type RouteStatus<TRoute extends RouteKey> = Extract<keyof EmployeesContract[TRoute]['responses'], number>
type RouteResponse<TRoute extends RouteKey, TStatus extends RouteStatus<TRoute>> = {
  status: TStatus
  body: ServerInferResponseBody<EmployeesContract[TRoute], TStatus>
}

type KnownErrorStatus = 400 | 404 | 409 | 500

function successResponse<TRoute extends RouteKey, TStatus extends RouteStatus<TRoute>>(
  _route: TRoute,
  status: TStatus,
  data: unknown,
  message: string,
): RouteResponse<TRoute, TStatus> {
  const body = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }

  return { status, body } as unknown as RouteResponse<TRoute, TStatus>
}

function errorResponse<TRoute extends RouteKey, TStatus extends KnownErrorStatus & RouteStatus<TRoute>>(
  _route: TRoute,
  status: TStatus,
  message: string,
  error?: string,
): RouteResponse<TRoute, TStatus> {
  const body = {
    success: false,
    message,
    statusCode: status,
    timestamp: new Date().toISOString(),
    ...(error ? { error } : {}),
  }

  return { status, body } as unknown as RouteResponse<TRoute, TStatus>
}

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
      return successResponse('listEmployees', 200, employees, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError('listEmployees', error, 'Failed to list employees', [500] as const)
    }
  },
  getEmployeeById: async ({ params }: GetEmployeeRequest) => {
    try {
      const employee = await getEmployeeById(params.id)
      if (!employee) {
        return errorResponse('getEmployeeById', 404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse('getEmployeeById', 200, employee, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError('getEmployeeById', error, 'Failed to get employee', [404, 500] as const)
    }
  },
  createEmployee: async ({ body }: CreateEmployeeRequest) => {
    try {
      const employee = await createEmployee(body)
      return successResponse('createEmployee', 200, employee, SUCCESS_MESSAGES.GENERIC.CREATED)
    } catch (error) {
      return handleError('createEmployee', error, 'Failed to create employee', [400, 500] as const)
    }
  },
  updateEmployee: async ({ params, body }: UpdateEmployeeRequest) => {
    try {
      const employee = await updateEmployee(params.id, body)
      if (!employee) {
        return errorResponse('updateEmployee', 404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse('updateEmployee', 200, employee, SUCCESS_MESSAGES.GENERIC.UPDATED)
    } catch (error) {
      return handleError('updateEmployee', error, 'Failed to update employee', [400, 404, 500] as const)
    }
  },
  deleteEmployee: async ({ params }: DeleteEmployeeRequest) => {
    try {
      const deleted = await deleteEmployee(params.id)
      if (!deleted) {
        return errorResponse('deleteEmployee', 404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse('deleteEmployee', 200, { id: params.id }, SUCCESS_MESSAGES.GENERIC.DELETED)
    } catch (error) {
      return handleError('deleteEmployee', error, 'Failed to delete employee', [404, 500] as const)
    }
  },
  getEmployeeAccount: async ({ params }: GetEmployeeAccountRequest) => {
    try {
      const account = await fetchEmployeeAccount(params.id)
      if (!account) {
        return errorResponse('getEmployeeAccount', 404, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(
        'getEmployeeAccount',
        200,
        toAccountResponse(account, params.id),
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      )
    } catch (error) {
      return handleAccountError('getEmployeeAccount', error, 'Failed to get employee account', [404, 500] as const)
    }
  },
  updateEmployeeAccount: async ({ params, body }: UpdateEmployeeAccountRequest) => {
    try {
      const account = await persistEmployeeAccount(params.id, toAccountUpdateData(body))
      return successResponse(
        'updateEmployeeAccount',
        200,
        toAccountResponse(account, params.id),
        SUCCESS_MESSAGES.GENERIC.UPDATED,
      )
    } catch (error) {
      return handleAccountError('updateEmployeeAccount', error, 'Failed to update employee account', [400, 404, 500] as const)
    }
  },
})

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

function handleError<TRoute extends RouteKey, Allowed extends KnownErrorStatus & RouteStatus<TRoute>>(
  route: TRoute,
  error: unknown,
  logMessage: string,
  allowedStatuses: readonly Allowed[],
): RouteResponse<TRoute, Allowed> {
  const fallback = (allowedStatuses.includes(500 as Allowed) ? 500 : allowedStatuses[0]) as Allowed

  if (error instanceof EmployeeServiceError) {
    const status = mapServiceStatus(error.status) as Allowed
    const finalStatus = allowedStatuses.includes(status) ? status : fallback
    return errorResponse(route, finalStatus, error.message, error.message)
  }

  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`)

  const message =
    fallback === 500 ? ERROR_MESSAGES.GENERIC.SERVER_ERROR : ERROR_MESSAGES.GENERIC.INVALID_REQUEST

  return errorResponse(route, fallback, message)
}

function handleAccountError<TRoute extends RouteKey, Allowed extends KnownErrorStatus & RouteStatus<TRoute>>(
  route: TRoute,
  error: unknown,
  logMessage: string,
  allowedStatuses: readonly Allowed[],
): RouteResponse<TRoute, Allowed> {
  if (error instanceof EmployeeServiceError) {
    return handleError(route, error, logMessage, allowedStatuses)
  }

  const fallback = (allowedStatuses.includes(500 as Allowed) ? 500 : allowedStatuses[0]) as Allowed

  if (error instanceof ZodError) {
    const status = allowedStatuses.includes(400 as Allowed) ? (400 as Allowed) : fallback
    return errorResponse(route, status, ERROR_MESSAGES.GENERIC.VALIDATION_FAILED)
  }

  if (error instanceof Error) {
    const mappedStatus = resolveAccountErrorStatus(error.message) as Allowed
    const finalStatus = allowedStatuses.includes(mappedStatus) ? mappedStatus : fallback

    if (finalStatus === 500) {
      logger.error(`${logMessage}: ${error.message}`)
      return errorResponse(route, finalStatus, ERROR_MESSAGES.GENERIC.SERVER_ERROR)
    }

    return errorResponse(route, finalStatus, error.message)
  }

  logger.error(`${logMessage}: ${String(error)}`)

  const message =
    fallback === 500 ? ERROR_MESSAGES.GENERIC.SERVER_ERROR : ERROR_MESSAGES.GENERIC.INVALID_REQUEST

  return errorResponse(route, fallback, message)
}

export function resolveAccountErrorStatus(message: string): KnownErrorStatus {
  const lower = message.toLowerCase()

  const notFoundKeywords = [
    'not found',
    'not exist',
    '找不到',
    '不存在',
    '尚未建立',
    '沒有綁定',
    '未綁定',
    '沒有建立',
  ]

  if (notFoundKeywords.some((keyword) => lower.includes(keyword))) {
    return 404
  }

  const badRequestKeywords = [
    'invalid',
    '格式',
    '無效',
    '已被使用',
    '已使用',
    '重複',
    'duplicate',
    '已存在',
    'conflict',
    '格式錯誤',
  ]

  if (badRequestKeywords.some((keyword) => lower.includes(keyword))) {
    return 400
  }

  return 400
}

const router: Router = Router()
createExpressEndpoints(employeesContract, implementation, router, {
  requestValidationErrorHandler: createValidationErrorHandler({
    defaultStatus: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
    pathParamStatus: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
  }),
})

export default router
