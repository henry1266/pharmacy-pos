/**
 * 員工模組 - 類型定義統一入口
 * 匯出所有員工相關的類型定義
 */

// 從核心服務匯入類型
export type {
  // 員工基本類型
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
} from '../core/employeeService';

export type {
  // 員工帳號服務類型
  CreateEmployeeAccountData,
  UpdateEmployeeAccountData
} from '../core/employeeAccountService';

export type {
  // 員工排班類型
  EmployeeSchedule,
  ScheduleData,
  SchedulesByDate
} from '../core/employeeScheduleService';

export type {
  // 加班記錄類型
  OvertimeRecord,
  OvertimeRecordStatus,
  OvertimeRecordQueryParams,
  OvertimeRecordCreateData,
  OvertimeSummary,
  EmployeeOvertimeSummary,
  MonthlyOvertimeStats
} from '../core/overtimeRecordService';

export type {
  // 班次時間配置類型
  ShiftTimeConfig,
  ShiftTimeConfigData,
  ShiftTimeConfigUpdateData,
  ShiftTimesMap
} from '../core/shiftTimeConfigService';

// 員工模組專用的業務類型定義

/**
 * 員工狀態枚舉
 */
export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

/**
 * 員工角色枚舉
 */
export enum EmployeeRole {
  ADMIN = 'admin',
  PHARMACIST = 'pharmacist',
  STAFF = 'staff'
}

/**
 * 排班班次枚舉
 */
export enum ShiftType {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening'
}

/**
 * 請假類型枚舉
 */
export enum LeaveType {
  SICK = 'sick',
  PERSONAL = 'personal',
  OVERTIME = 'overtime'
}

/**
 * 加班狀態枚舉
 */
export enum OvertimeStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

/**
 * 員工詳細資訊介面（包含統計數據）
 */
export interface EmployeeDetail {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  position: string;
  department?: string;
  hireDate: string | Date;
  salary?: number;
  birthDate?: string | Date;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // 擴展屬性
  account?: {
    _id: string;
    employeeId: string;
    username: string;
    email?: string;
    role: 'admin' | 'pharmacist' | 'staff';
    isActive: boolean;
    lastLoginAt?: string | Date;
    createdAt: string | Date;
    updatedAt: string | Date;
  };
  workYears?: number;
  totalOvertimeHours?: number;
  monthlyScheduleCount?: number;
  lastLoginDate?: string | Date;
  isUpcomingBirthday?: boolean;
}

/**
 * 員工搜尋篩選條件
 */
export interface EmployeeSearchFilters {
  name?: string;
  position?: string;
  department?: string;
  role?: EmployeeRole;
  status?: EmployeeStatus;
  hasAccount?: boolean;
  startDate?: string;
  endDate?: string;
}

/**
 * 員工統計摘要
 */
export interface EmployeeStatsSummary {
  totalEmployees: number;
  activeEmployees: number;
  employeesWithAccounts: number;
  employeesWithoutAccounts: number;
  totalOvertimeHours: number;
  averageWorkYears: number;
  upcomingBirthdays: number;
  departmentStats: {
    department: string;
    count: number;
  }[];
  roleStats: {
    role: EmployeeRole;
    count: number;
  }[];
}

/**
 * 排班統計資料
 */
export interface ScheduleStats {
  totalSchedules: number;
  schedulesByShift: {
    [key in ShiftType]: number;
  };
  schedulesByEmployee: {
    employeeId: string;
    employeeName: string;
    scheduleCount: number;
    overtimeCount: number;
  }[];
  monthlyTrend: {
    month: string;
    scheduleCount: number;
    overtimeCount: number;
  }[];
}

/**
 * 員工表單驗證結果
 */
export interface EmployeeFormValidation {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}

/**
 * 員工匯入資料格式
 */
export interface EmployeeImportData {
  name: string;
  phone: string;
  email?: string;
  position: string;
  department?: string;
  hireDate: string;
  salary?: number;
  birthDate?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

/**
 * 員工匯入結果
 */
export interface EmployeeImportResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors: {
    row: number;
    field: string;
    message: string;
    data: EmployeeImportData;
  }[];
  warnings: {
    row: number;
    field: string;
    message: string;
    data: EmployeeImportData;
  }[];
}

/**
 * 員工績效評估資料
 */
export interface EmployeePerformance {
  employeeId: string;
  evaluationPeriod: {
    startDate: string;
    endDate: string;
  };
  attendanceRate: number;
  overtimeHours: number;
  punctualityScore: number;
  performanceScore: number;
  comments?: string;
  evaluatedBy: string;
  evaluatedAt: string | Date;
}

/**
 * 員工考勤記錄
 */
export interface EmployeeAttendance {
  _id: string;
  employeeId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workHours?: number;
  overtimeHours?: number;
  status: 'present' | 'absent' | 'late' | 'early_leave';
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}