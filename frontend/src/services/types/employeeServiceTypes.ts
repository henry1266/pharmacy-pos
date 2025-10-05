import type { Employee } from '@pharmacy-pos/shared/types/entities'
import { employeeAccountUpdateSchema, employeeSearchSchema } from '@pharmacy-pos/shared/schemas/zod/employee'
import type { z } from 'zod'

export type EmployeeQueryParams = z.infer<typeof employeeSearchSchema>
export type EmployeeAccountUpdateInput = z.infer<typeof employeeAccountUpdateSchema>

export interface PersonnelResponse {
  employees: Employee[]
  totalCount: number
  page: number
  limit: number
}
