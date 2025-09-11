/**
 * 員工模組共用元件索引檔案
 */

// 型別定義
export * from './types';

// 常數定義
export * from './constants';

// 工具函數
export * from './utils';

// 共用組件
export * from './components';

// Hooks
export * from './hooks';

// 明確導出主要組件
export {
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
  CommonDialog,
  FormField,
  MonthFilter,
  AccountInfo,
  StatusChip,
  EmptyState,
  ActionButtons
} from './components';

// 明確導出主要 Hooks
export {
  useAccountManagement,
  useFormManagement,
  useDialogManagement,
  useOvertimeManagement,
  useMonthFilter,
  useExpandedState
} from './hooks';

// 明確導出主要工具函數
export {
  getRoleName,
  getRoleColor,
  getStatusText,
  getStatusColor,
  formatDate,
  formatDateToYYYYMMDD,
  validateAccountForm,
  validateOvertimeForm,
  clearFieldError,
  getChangedFields,
  handleApiError,
  isValidEmail,
  calculateTotalHours,
  sortRecordsByDate
} from './utils';

// 明確導出主要常數
export {
  ROLE_OPTIONS,
  ROLE_COLORS,
  ROLE_NAMES,
  STATUS_CONFIG,
  VALIDATION_RULES,
  YEAR_OPTIONS,
  MONTH_OPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_FORM_VALUES
} from './constants';