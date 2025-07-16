/**
 * 員工模組組件匯出
 * 統一匯出所有員工相關的 UI 組件
 */

// 主要組件
export { default as EmployeeForm } from './EmployeeForm';
export { default as EmployeeAccountManager } from './EmployeeAccountManager';
export { default as OvertimeManager } from './OvertimeManager';
export { default as Scheduling } from './Scheduling';
export { default as ShiftSection } from './ShiftSection';
export { default as ShiftSelectionModal } from './ShiftSelectionModal';
export { default as Overtime } from './Overtime';
export { default as QuickSelectPanel } from './QuickSelectPanel';

// 表單組件
export { default as BasicInfo } from './BasicInfo';
export { default as PersonalInfoSection } from './PersonalInfoSection';
export { default as ContactInfoSection } from './ContactInfoSection';
export { default as WorkInfoSection } from './WorkInfoSection';
export { default as AdditionalInfoSection } from './AdditionalInfoSection';
export { default as IDCardSection } from './IDCardSection';

// 帳號管理組件
export { default as AccountDialog } from './account/AccountDialog';
export { default as EmployeeAccountRow } from './account/EmployeeAccountRow';
export { default as FormField } from './account/FormField';

// 加班管理組件
export { default as OvertimeDialogs } from './overtime/OvertimeDialogs';
export { default as OvertimeFilters } from './overtime/OvertimeFilters';
export { default as OvertimeRecordDialog } from './overtime/OvertimeRecordDialog';
export { default as OvertimeRecordRow } from './overtime/OvertimeRecordRow';
export { default as OvertimeRecordTable } from './overtime/OvertimeRecordTable';

// 排班組件
export { default as CalendarDateCell } from './scheduling/CalendarDateCell';
export { default as CalendarGrid } from './scheduling/CalendarGrid';
export { default as HoursStatBlock } from './scheduling/HoursStatBlock';
export { default as MonthNavigation } from './scheduling/MonthNavigation';
export { default as SchedulingHeader } from './scheduling/SchedulingHeader';
export { default as ShiftBlock } from './scheduling/ShiftBlock';
export { default as ShiftDisplaySection } from './scheduling/ShiftDisplaySection';
export { default as WorkHoursDialog } from './scheduling/WorkHoursDialog';
export { default as WorkHoursStatCard } from './scheduling/WorkHoursStatCard';

// 共享組件
export * from './shared';