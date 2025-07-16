/**
 * 員工模組共用型別定義
 */

import { ChangeEvent } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { Role, Employee, EmployeeAccount } from '@pharmacy-pos/shared/types/entities';
import { OvertimeRecord, OvertimeRecordStatus } from '../../types';

// 表單資料介面
export interface FormData {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: Role;
  employeeId?: string;
  date?: string;
  hours?: string | number;
  description?: string;
  status?: OvertimeRecordStatus;
  [key: string]: any;
}

// 表單錯誤介面
export interface FormErrors {
  [key: string]: string;
}

// 角色選項介面
export interface RoleOption {
  value: Role;
  label: string;
}

// 員工帳號管理 Props
export interface EmployeeAccountManagerProps {
  employeeId: string;
  employeeName: string;
  onAccountChange?: () => void;
}

// 加班管理 Props
export interface OvertimeManagerProps {
  isAdmin?: boolean;
  employeeId?: string | null;
}

// 簡化的員工介面，用於加班數據處理
export interface OvertimeEmployee {
  _id: string;
  name: string;
  position?: string;
  [key: string]: any;
}

// 排班加班記錄介面
export interface ScheduleOvertimeRecord {
  _id: string;
  date: string | Date;
  shift: 'morning' | 'afternoon' | 'evening';
  employee?: {
    _id: string;
    name: string;
    [key: string]: any;
  };
  employeeId?: {
    _id: string;
    name: string;
    [key: string]: any;
  };
  leaveType?: string;
  [key: string]: any;
}

// 加班統計數據介面
export interface OvertimeStat {
  employeeId: string;
  overtimeHours: number;
  independentRecordCount?: number;
  scheduleRecordCount?: number;
  [key: string]: any;
}

// 處理後的加班記錄介面
export interface ProcessedOvertimeGroup {
  employee: {
    _id: string;
    name: string;
    [key: string]: any;
  };
  records: OvertimeRecord[];
  independentHours: number;
  scheduleHours: number;
  totalHours: number;
  scheduleRecords: ScheduleOvertimeRecord[];
  latestDate: Date;
}

// 處理後的加班數據介面
export interface ProcessedOvertimeData {
  [employeeId: string]: ProcessedOvertimeGroup;
}

// 排班加班記錄分組介面
export interface ScheduleOvertimeRecords {
  [employeeId: string]: ScheduleOvertimeRecord[];
}

// 展開狀態介面
export interface ExpandedEmployees {
  [employeeId: string]: boolean;
}

// 對話框 Props
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onConfirm: () => void;
  confirmText: string;
  confirmColor?: 'primary' | 'error' | 'warning';
  submitting: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children?: React.ReactNode;
}

// 表單欄位 Props
export interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  options?: RoleOption[];
}

// 加班記錄對話框 Props
export interface OvertimeRecordDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  formData: FormData;
  formErrors: FormErrors;
  employees: Employee[];
  employeeId?: string | null;
  isAdmin: boolean;
  submitting: boolean;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  onSubmit: () => void;
  submitButtonText: string;
}

// 加班記錄行 Props
export interface OvertimeRecordRowProps {
  record: any;
  isAdmin: boolean;
  onEdit: (record: OvertimeRecord) => void;
  onDelete: (record: OvertimeRecord) => void;
  onApprove: (record: OvertimeRecord) => void;
  onReject: (record: OvertimeRecord) => void;
  formatDate: (dateString: string) => string;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => 'warning' | 'success' | 'error' | 'default';
}

// 月份篩選器 Props
export interface MonthFilterProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

// 帳號資訊顯示 Props
export interface AccountInfoProps {
  account: EmployeeAccount;
  onEdit: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
}

// 狀態晶片 Props
export interface StatusChipProps {
  status: string;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => 'warning' | 'success' | 'error' | 'default';
}