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
  createEmployeeAccount as createEmployeeAccountRecord,
  getEmployeeAccount as fetchEmployeeAccount,
  updateEmployeeAccount as persistEmployeeAccount,
  deleteEmployeeAccount as removeEmployeeAccount,
  unbindEmployeeAccount as detachEmployeeAccount,
} from '../../services/employeeAccountService'
import {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDate,
  EmployeeScheduleServiceError,
} from './services/schedule.service'
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
type CreateEmployeeAccountRequest = ServerInferRequest<typeof employeesContract['createEmployeeAccount']>
type UpdateEmployeeAccountRequest = ServerInferRequest<typeof employeesContract['updateEmployeeAccount']>
type DeleteEmployeeAccountRequest = ServerInferRequest<typeof employeesContract['deleteEmployeeAccount']>
type UnbindEmployeeAccountRequest = ServerInferRequest<typeof employeesContract['unbindEmployeeAccount']>
type ListEmployeeSchedulesRequest = ServerInferRequest<typeof employeesContract['listEmployeeSchedules']>
type CreateEmployeeScheduleRequest = ServerInferRequest<typeof employeesContract['createEmployeeSchedule']>
type UpdateEmployeeScheduleRequest = ServerInferRequest<typeof employeesContract['updateEmployeeSchedule']>
type DeleteEmployeeScheduleRequest = ServerInferRequest<typeof employeesContract['deleteEmployeeSchedule']>
type GetEmployeeSchedulesByDateRequest = ServerInferRequest<typeof employeesContract['getEmployeeSchedulesByDate']>
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
      return successResponse('listEmployees', API_CONSTANTS.HTTP_STATUS.OK, employees, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError('listEmployees', error, 'Failed to list employees', [500] as const)
    }
  },
  getEmployeeById: async ({ params }: GetEmployeeRequest) => {
    try {
      const employee = await getEmployeeById(params.id)
      if (!employee) {
        return errorResponse('getEmployeeById', API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse('getEmployeeById', API_CONSTANTS.HTTP_STATUS.OK, employee, SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS)
    } catch (error) {
      return handleError('getEmployeeById', error, 'Failed to get employee', [404, 500] as const)
    }
  },
  createEmployee: async ({ body }: CreateEmployeeRequest) => {
    try {
      const employee = await createEmployee(body)
      return successResponse('createEmployee', API_CONSTANTS.HTTP_STATUS.OK, employee, SUCCESS_MESSAGES.GENERIC.CREATED)
    } catch (error) {
      return handleError('createEmployee', error, 'Failed to create employee', [400, 500] as const)
    }
  },
  updateEmployee: async ({ params, body }: UpdateEmployeeRequest) => {
    try {
      const employee = await updateEmployee(params.id, body)
      if (!employee) {
        return errorResponse('updateEmployee', API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse('updateEmployee', API_CONSTANTS.HTTP_STATUS.OK, employee, SUCCESS_MESSAGES.GENERIC.UPDATED)
    } catch (error) {
      return handleError('updateEmployee', error, 'Failed to update employee', [400, 404, 500] as const)
    }
  },
  deleteEmployee: async ({ params }: DeleteEmployeeRequest) => {
    try {
      const deleted = await deleteEmployee(params.id)
      if (!deleted) {
        return errorResponse('deleteEmployee', API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse('deleteEmployee', API_CONSTANTS.HTTP_STATUS.OK, { id: params.id }, SUCCESS_MESSAGES.GENERIC.DELETED)
    } catch (error) {
      return handleError('deleteEmployee', error, 'Failed to delete employee', [404, 500] as const)
    }
  },
  getEmployeeAccount: async ({ params }: GetEmployeeAccountRequest) => {
    try {
      const account = await fetchEmployeeAccount(params.employeeId)
      if (!account) {
        return errorResponse('getEmployeeAccount', API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(
        'getEmployeeAccount',
        API_CONSTANTS.HTTP_STATUS.OK,
        toAccountResponse(account, params.employeeId),
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      )
    } catch (error) {
      return handleAccountError('getEmployeeAccount', error, 'Failed to get employee account', [404, 500] as const)
    }
  },
  createEmployeeAccount: async ({ body }: CreateEmployeeAccountRequest) => {
    try {
      const accountInput = {
        employeeId: body.employeeId,
        username: body.username,
        password: body.password,
        role: body.role,
        ...(body.email !== undefined ? { email: body.email } : {}),
      }
      await createEmployeeAccountRecord(accountInput)
      const account = await fetchEmployeeAccount(body.employeeId)
      return successResponse(
        'createEmployeeAccount',
        API_CONSTANTS.HTTP_STATUS.OK,
        toAccountResponse(account, body.employeeId),
        SUCCESS_MESSAGES.GENERIC.CREATED,
      )
    } catch (error) {
      return handleAccountError('createEmployeeAccount', error, 'Failed to create employee account', [400, 404, 409, 500] as const)
    }
  },
  updateEmployeeAccount: async ({ params, body }: UpdateEmployeeAccountRequest) => {
    try {
      const account = await persistEmployeeAccount(params.employeeId, toAccountUpdateData(body))
      return successResponse(
        'updateEmployeeAccount',
        API_CONSTANTS.HTTP_STATUS.OK,
        toAccountResponse(account, params.employeeId),
        SUCCESS_MESSAGES.GENERIC.UPDATED,
      )
    } catch (error) {
      return handleAccountError('updateEmployeeAccount', error, 'Failed to update employee account', [400, 404, 409, 500] as const)
    }
  },
  deleteEmployeeAccount: async ({ params }: DeleteEmployeeAccountRequest) => {
    try {
      await removeEmployeeAccount(params.employeeId)
      return successResponse(
        'deleteEmployeeAccount',
        API_CONSTANTS.HTTP_STATUS.OK,
        { id: params.employeeId },
        SUCCESS_MESSAGES.GENERIC.DELETED,
      )
    } catch (error) {
      return handleAccountError('deleteEmployeeAccount', error, 'Failed to delete employee account', [404, 500] as const)
    }
  },
  unbindEmployeeAccount: async ({ params }: UnbindEmployeeAccountRequest) => {
    try {
      const result = await detachEmployeeAccount(params.employeeId)
      const data = {
        employeeId: params.employeeId,
        unbound: true,
        userId: typeof result?.user?.id === 'string' ? result.user.id : undefined,
      }
      return successResponse(
        'unbindEmployeeAccount',
        API_CONSTANTS.HTTP_STATUS.OK,
        data,
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      )
    } catch (error) {
      return handleAccountError('unbindEmployeeAccount', error, 'Failed to unbind employee account', [404, 500] as const)
    }
  },
  listEmployeeSchedules: async ({ query }: ListEmployeeSchedulesRequest) => {
    try {
      const schedules = await listSchedules(query ?? {})
      return successResponse(
        'listEmployeeSchedules',
        API_CONSTANTS.HTTP_STATUS.OK,
        schedules,
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      )
    } catch (error) {
      return handleScheduleError('listEmployeeSchedules', error, 'Failed to list employee schedules', [400, 500] as const)
    }
  },
  createEmployeeSchedule: async ({ body }: CreateEmployeeScheduleRequest) => {
    try {
      const schedule = await createSchedule(body)
      return successResponse(
        'createEmployeeSchedule',
        API_CONSTANTS.HTTP_STATUS.OK,
        schedule,
        SUCCESS_MESSAGES.GENERIC.CREATED,
      )
    } catch (error) {
      return handleScheduleError('createEmployeeSchedule', error, 'Failed to create employee schedule', [400, 404, 409, 500] as const)
    }
  },
  updateEmployeeSchedule: async ({ params, body }: UpdateEmployeeScheduleRequest) => {
    try {
      const schedule = await updateSchedule(params.scheduleId, body)
      if (!schedule) {
        return errorResponse('updateEmployeeSchedule', API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(
        'updateEmployeeSchedule',
        API_CONSTANTS.HTTP_STATUS.OK,
        schedule,
        SUCCESS_MESSAGES.GENERIC.UPDATED,
      )
    } catch (error) {
      return handleScheduleError('updateEmployeeSchedule', error, 'Failed to update employee schedule', [400, 404, 409, 500] as const)
    }
  },
  deleteEmployeeSchedule: async ({ params }: DeleteEmployeeScheduleRequest) => {
    try {
      const deleted = await deleteSchedule(params.scheduleId)
      if (!deleted) {
        return errorResponse('deleteEmployeeSchedule', API_CONSTANTS.HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.GENERIC.NOT_FOUND)
      }
      return successResponse(
        'deleteEmployeeSchedule',
        API_CONSTANTS.HTTP_STATUS.OK,
        { id: params.scheduleId },
        SUCCESS_MESSAGES.GENERIC.DELETED,
      )
    } catch (error) {
      return handleScheduleError('deleteEmployeeSchedule', error, 'Failed to delete employee schedule', [404, 500] as const)
    }
  },
  getEmployeeSchedulesByDate: async ({ query }: GetEmployeeSchedulesByDateRequest) => {
    try {
      const schedules = await getSchedulesByDate(query)
      return successResponse(
        'getEmployeeSchedulesByDate',
        API_CONSTANTS.HTTP_STATUS.OK,
        schedules,
        SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      )
    } catch (error) {
      return handleScheduleError('getEmployeeSchedulesByDate', error, 'Failed to get employee schedules by date', [400, 500] as const)
    }
  },
})

function toAccountResponse(account: any, employeeId: string) {
  const normalized = {
    _id: account?._id?.toString() ?? account?.id,
    employeeId,
    username: account?.username,
    email: account?.email ?? undefined,
    role: account?.role,
    isActive: account?.isActive ?? true,
    lastLogin: account?.lastLogin ?? undefined,
    settings: account?.settings ?? undefined,
    createdAt: account?.createdAt ?? new Date(),
    updatedAt: account?.updatedAt ?? new Date(),
  }
  return employeeAccountSchema.parse(normalized)
}

function mapServiceStatus(status: number): KnownErrorStatus {
  if (status === API_CONSTANTS.HTTP_STATUS.NOT_FOUND) return 404
  if (status === API_CONSTANTS.HTTP_STATUS.BAD_REQUEST) return 400
  if (status === API_CONSTANTS.HTTP_STATUS.CONFLICT) return 409
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

function handleScheduleError<TRoute extends RouteKey, Allowed extends KnownErrorStatus & RouteStatus<TRoute>>(
  route: TRoute,
  error: unknown,
  logMessage: string,
  allowedStatuses: readonly Allowed[],
): RouteResponse<TRoute, Allowed> {
  const fallback = (allowedStatuses.includes(500 as Allowed) ? 500 : allowedStatuses[0]) as Allowed

  if (error instanceof EmployeeScheduleServiceError) {
    const status = mapServiceStatus(error.status) as Allowed
    const finalStatus = allowedStatuses.includes(status) ? status : fallback
    return errorResponse(route, finalStatus, error.message, error.message)
  }

  if (error instanceof ZodError) {
    const status = allowedStatuses.includes(400 as Allowed) ? (400 as Allowed) : fallback
    return errorResponse(route, status, ERROR_MESSAGES.GENERIC.VALIDATION_FAILED)
  }

  logger.error(`${logMessage}: ${error instanceof Error ? error.message : String(error)}`)

  const message =
    fallback === 500 ? ERROR_MESSAGES.GENERIC.SERVER_ERROR : ERROR_MESSAGES.GENERIC.INVALID_REQUEST

  return errorResponse(route, fallback, message)
}

export function resolveAccountErrorStatus(message: string): KnownErrorStatus {
  const lower = message.toLowerCase()

  const notFoundKeywords = [
    'not found',
    'not exist',
    '\u627e\u4e0d\u5230', // 找不到
    '\u4e0d\u5b58\u5728', // 不存在
    '\u5c1a\u672a\u5efa\u7acb', // 尚未建立
    '\u6c92\u6709\u8cc7\u6599', // 沒有資料
    '\u6c92\u6709\u5e33\u865f', // 沒有帳號
  ]

  if (notFoundKeywords.some((keyword) => lower.includes(keyword))) {
    return 404
  }

  const conflictKeywords = [
    'duplicate',
    'already',
    'conflict',
    'already exists',
    '\u5df2\u5b58\u5728', // 已存在
    '\u5df2\u7d81\u5b9a', // 已綁定
    '\u5df2\u88ab\u4f7f\u7528', // 已被使用
  ]

  if (conflictKeywords.some((keyword) => lower.includes(keyword))) {
    return 409
  }

  const badRequestKeywords = [
    'invalid',
    'format',
    '\u683c\u5f0f', // 格式
    '\u4e0d\u53ef', // 不可
    '\u5df2\u4f7f\u7528', // 已使用
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


