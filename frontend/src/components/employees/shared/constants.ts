/**
 * 員工模組共用常數定義
 */

import { RoleOption } from './types';

// 角色選項配置
export const ROLE_OPTIONS: RoleOption[] = [
  { value: 'admin', label: '管理員' },
  { value: 'pharmacist', label: '藥師' },
  { value: 'staff', label: '員工' }
];

// 角色顏色配置
export const ROLE_COLORS = {
  admin: 'error' as const,
  pharmacist: 'success' as const,
  staff: 'primary' as const,
  default: 'default' as const
};

// 角色名稱映射
export const ROLE_NAMES = {
  admin: '管理員',
  pharmacist: '藥師',
  staff: '員工'
};

// 狀態配置
export const STATUS_CONFIG = {
  pending: { color: 'warning' as const, text: '待審核' },
  approved: { color: 'success' as const, text: '已核准' },
  rejected: { color: 'error' as const, text: '已拒絕' }
};

// 表單驗證規則
export const VALIDATION_RULES = {
  username: {
    minLength: 3,
    required: true
  },
  password: {
    minLength: 6,
    required: true
  },
  hours: {
    min: 0.5,
    max: 24,
    required: true
  }
};

// 對話框配置
export const DIALOG_CONFIG = {
  maxWidth: {
    small: 'xs' as const,
    medium: 'sm' as const,
    large: 'md' as const
  },
  autoHideDuration: 5000
};

// 年份選項
export const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

// 月份選項
export const MONTH_OPTIONS = [
  { value: 0, label: '1月' },
  { value: 1, label: '2月' },
  { value: 2, label: '3月' },
  { value: 3, label: '4月' },
  { value: 4, label: '5月' },
  { value: 5, label: '6月' },
  { value: 6, label: '7月' },
  { value: 7, label: '8月' },
  { value: 8, label: '9月' },
  { value: 9, label: '10月' },
  { value: 10, label: '11月' },
  { value: 11, label: '12月' }
];

// 班次選項
export const SHIFT_OPTIONS = {
  morning: '早班',
  afternoon: '午班',
  evening: '晚班'
};

// 表格配置
export const TABLE_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
  maxHeight: '400px'
};

// API 端點
export const API_ENDPOINTS = {
  overtimeStats: '/api/overtime-records/monthly-stats',
  employeeSchedules: '/api/employee-schedules'
};

// 錯誤訊息
export const ERROR_MESSAGES = {
  required: '此欄位為必填',
  invalidEmail: '請輸入有效的電子郵件地址',
  passwordMismatch: '兩次輸入的密碼不一致',
  invalidHours: '加班時數必須在 0.5 到 24 小時之間',
  networkError: '網路連線錯誤，請稍後再試',
  unauthorized: '您沒有權限執行此操作'
};

// 成功訊息
export const SUCCESS_MESSAGES = {
  accountCreated: '員工帳號創建成功',
  accountUpdated: '員工帳號更新成功',
  passwordReset: '密碼重設成功',
  accountDeleted: '員工帳號已刪除',
  overtimeCreated: '加班記錄創建成功',
  overtimeUpdated: '加班記錄更新成功',
  overtimeDeleted: '加班記錄已刪除',
  overtimeApproved: '加班記錄已核准',
  overtimeRejected: '加班記錄已拒絕'
};

// 表單預設值
export const DEFAULT_FORM_VALUES = {
  account: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff' as const
  },
  overtime: {
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    status: 'pending' as const
  }
};

// 日期格式
export const DATE_FORMATS = {
  display: 'zh-TW',
  input: 'YYYY-MM-DD',
  api: 'YYYY-MM-DD'
};