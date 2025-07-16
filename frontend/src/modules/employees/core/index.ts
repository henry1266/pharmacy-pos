/**
 * 員工模組 - 核心服務層統一入口
 * 匯出所有核心服務和相關類型定義
 */

// 員工基本服務
export { default as employeeService } from './employeeService';
export type {
  EmployeeQueryParams,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  EmployeeListResponse,
  EmployeeAccountCreateRequest,
  EmployeeAccountUpdateRequest,
  EmployeeStats,
  Employee,
  EmployeeAccount,
  EmployeeWithAccount
} from './employeeService';

// 員工帳號服務 (避免命名衝突，使用別名)
export { default as employeeAccountService } from './employeeAccountService';
export type {
  CreateEmployeeAccountData,
  UpdateEmployeeAccountData
} from './employeeAccountService';

// 員工排班服務
export { default as employeeScheduleService } from './employeeScheduleService';
export type {
  EmployeeSchedule,
  ScheduleData,
  SchedulesByDate
} from './employeeScheduleService';

// 加班記錄服務
export { default as overtimeRecordService } from './overtimeRecordService';
export type {
  OvertimeRecord,
  OvertimeRecordStatus,
  OvertimeRecordQueryParams,
  OvertimeRecordCreateData,
  OvertimeSummary,
  EmployeeOvertimeSummary,
  MonthlyOvertimeStats
} from './overtimeRecordService';

// 統一的服務集合
export const employeeCoreServices = {
  employeeService: () => import('./employeeService').then(m => m.default),
  employeeAccountService: () => import('./employeeAccountService').then(m => m.default),
  employeeScheduleService: () => import('./employeeScheduleService').then(m => m.default),
  overtimeRecordService: () => import('./overtimeRecordService').then(m => m.default)
};