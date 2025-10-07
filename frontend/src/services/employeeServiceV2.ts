import type { Employee } from '@pharmacy-pos/shared/types/entities'
import type { EmployeeAccount } from '@pharmacy-pos/shared/types/entities'
import { createEmployeeContractClient } from '@/features/employees/api/client'
import type { EmployeeQueryParams, EmployeeAccountUpdateInput } from './types/employeeServiceTypes'

type SuccessEnvelope<T> = {
  success: true
  message?: string
  data?: T
  timestamp?: string
}

const employeeClient = createEmployeeContractClient()

type ContractResult = { status: number; body: unknown }

const createError = (result: ContractResult, fallback: string): Error => {
  const body = result.body as Record<string, unknown> | undefined
  const message =
    typeof body?.message === 'string' ? body.message
      : typeof body?.msg === 'string' ? body.msg
        : fallback
  const error = new Error(message)
  ;(error as any).status = result.status
  ;(error as any).body = result.body
  return error
}

const unwrapResponse = <T>(result: ContractResult, fallback: string, defaultValue?: T): T => {
  const { status, body } = result

  if (status < 200 || status >= 300) {
    throw createError(result, fallback)
  }

  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as SuccessEnvelope<T>
    if (!envelope.success) {
      throw createError(result, fallback)
    }
    return envelope.data ?? (defaultValue as T)
  }

  if (body !== undefined && body !== null) {
    return body as T
  }

  if (defaultValue !== undefined) {
    return defaultValue
  }

  throw createError(result, fallback)
}

export const getEmployees = async (
  params?: EmployeeQueryParams,
): Promise<Employee[]> => {
  const result = await employeeClient.listEmployees({ query: params })
  return unwrapResponse<Employee[]>(result, 'Failed to fetch employees', [])
}

export const getEmployeeById = async (id: string): Promise<Employee> => {
  const result = await employeeClient.getEmployeeById({ params: { id } })
  return unwrapResponse<Employee>(result, 'Failed to fetch employee detail')
}

export const createEmployee = async (payload: Partial<Employee>): Promise<Employee> => {
  const result = await employeeClient.createEmployee({ body: payload as any })
  return unwrapResponse<Employee>(result, 'Failed to create employee')
}

export const updateEmployee = async (id: string, payload: Partial<Employee>): Promise<Employee> => {
  const result = await employeeClient.updateEmployee({ params: { id }, body: payload as any })
  return unwrapResponse<Employee>(result, 'Failed to update employee')
}

export const deleteEmployee = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const result = await employeeClient.deleteEmployee({ params: { id } })
  const body = unwrapResponse<{ success?: boolean; message?: string; msg?: string }>(
    result,
    'Failed to delete employee',
    {},
  )
  const message = body.message ?? body.msg
  return {
    success: body.success ?? true,
    ...(message ? { message } : {}),
  }
}

export const getEmployeeAccount = async (id: string): Promise<EmployeeAccount> => {
  const result = await employeeClient.getEmployeeAccount({ params: { employeeId: id } })
  return unwrapResponse<EmployeeAccount>(result, 'Failed to fetch employee account')
}

export const updateEmployeeAccount = async (
  id: string,
  payload: EmployeeAccountUpdateInput,
): Promise<EmployeeAccount> => {
  const result = await employeeClient.updateEmployeeAccount({ params: { employeeId: id }, body: payload as any })
  return unwrapResponse<EmployeeAccount>(result, 'Failed to update employee account')
}

export default {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeAccount,
  updateEmployeeAccount,
}

