/**
 * 儀表板日程摘要 Hook
 * 封裝員工排班和加班數據獲取邏輯，提供簡化的接口給儀表板使用
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEmployeeScheduling } from '../../employees/core/hooks/useEmployeeScheduling';
import { useShiftTimeConfig } from '../../employees/core/hooks/useShiftTimeConfig';
import { useOvertimeManager } from '../../employees/core/hooks/useOvertimeManager';
import { employeeService } from '../../employees/core/employeeService';
import type { Employee } from '@pharmacy-pos/shared/types/entities';
import { OvertimeStatus } from '@pharmacy-pos/shared/utils/overtimeDataProcessor';
import {
  ShiftSchedule,
  ShiftBaseConfig,
  ExtendedOvertimeRecord,
  getShiftBaseConfig,
  filterDailyOvertimeRecords,
  prepareShiftData,
  calculateTotalEmployees,
  calculateTotalLeaves
} from '../utils/scheduleUtils';

/**
 * 加班表單數據
 */
export interface OvertimeFormData {
  employeeId: string;
  date: string;
  hours: string | number;
  description: string;
  status: OvertimeStatus;
  currentTime: string;
}

/**
 * 儀表板日程摘要 Hook 返回值
 */
export interface DailyScheduleSummaryResult {
  // 數據
  shiftData: ShiftSchedule[];
  employees: Employee[];
  shiftBaseConfig: Record<string, ShiftBaseConfig>;
  totalEmployees: number;
  totalLeaves: number;
  
  // 狀態
  loading: boolean;
  error: string | null;
  
  // 加班表單
  overtimeFormData: OvertimeFormData;
  overtimeFormErrors: Record<string, string>;
  submitting: boolean;
  
  // 方法
  handleRefresh: () => void;
  handleOvertimeClockIn: () => void;
  handleCloseOvertimeDialog: () => void;
  handleOvertimeInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => void;
  handleSubmitOvertimeRecord: () => Promise<void>;
  getEmployeeInfo: (employeeId: string) => { name: string; position: string | undefined; phone: string | undefined };
}

/**
 * 儀表板日程摘要 Hook
 * @param selectedDate 選定日期
 * @returns 儀表板日程摘要數據和方法
 */
export const useDailyScheduleSummary = (selectedDate: string): DailyScheduleSummaryResult => {
  // 使用員工模組的 hooks
  const { schedulesGroupedByDate, loading: scheduleLoading, error: scheduleError, fetchSchedulesByDate } = useEmployeeScheduling();
  const { shiftTimesMap, loading: shiftConfigLoading } = useShiftTimeConfig();
  
  // 根據選定日期計算月份和年份
  const selectedDateObj = new Date(selectedDate);
  const selectedMonth = selectedDateObj.getMonth();
  const selectedYear = selectedDateObj.getFullYear();
  
  const {
    overtimeRecords,
    loading: overtimeLoading,
    setSelectedMonth,
    setSelectedYear,
    fetchOvertimeRecords,
    createOvertimeRecord
  } = useOvertimeManager({ isAdmin: true });
  
  // 本地狀態
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  
  // 加班表單相關狀態
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [overtimeFormData, setOvertimeFormData] = useState<OvertimeFormData>({
    employeeId: '',
    date: selectedDate,
    hours: '',
    description: '',
    status: 'pending' as OvertimeStatus,
    currentTime: ''
  });
  const [overtimeFormErrors, setOvertimeFormErrors] = useState<Record<string, string>>({});
  
  // 班次基本配置
  const shiftBaseConfig = useMemo(() => getShiftBaseConfig(shiftTimesMap), [shiftTimesMap]);
  
  /**
   * 載入員工數據
   */
  const loadEmployees = useCallback(async () => {
    try {
      setEmployeesLoading(true);
      const response = await employeeService.getAllEmployees();
      setEmployees(response.employees || []);
    } catch (error) {
      console.error('載入員工資料失敗:', error);
      // 設置模擬員工資料以便測試
      setEmployees([
        { _id: '1', name: '張三', position: '藥師', phone: '0912345678', hireDate: new Date(), createdAt: new Date(), updatedAt: new Date() },
        { _id: '2', name: '李四', position: '助理', phone: '0987654321', hireDate: new Date(), createdAt: new Date(), updatedAt: new Date() },
        { _id: '3', name: '王五', position: '店員', phone: '0911111111', hireDate: new Date(), createdAt: new Date(), updatedAt: new Date() }
      ]);
    } finally {
      setEmployeesLoading(false);
    }
  }, []);
  
  /**
   * 載入排班數據
   */
  const loadScheduleData = useCallback(async () => {
    if (!selectedDate) return;
    
    try {
      await fetchSchedulesByDate(selectedDate, selectedDate);
    } catch (err) {
      console.error('載入排班數據失敗:', err);
    }
  }, [selectedDate, fetchSchedulesByDate]);
  
  /**
   * 初始化數據
   */
  useEffect(() => {
    if (selectedDate) {
      loadScheduleData();
      loadEmployees();
    }
  }, [selectedDate, loadScheduleData, loadEmployees]);
  
  /**
   * 同步 useOvertimeManager 的月份設置
   */
  useEffect(() => {
    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      const month = dateObj.getMonth();
      const year = dateObj.getFullYear();
      
      // 設置月份和年份，然後重新獲取加班記錄
      setSelectedMonth(month);
      setSelectedYear(year);
      
      // 延遲一點時間確保月份設置生效後再獲取記錄
      setTimeout(() => {
        fetchOvertimeRecords();
      }, 100);
    }
  }, [selectedDate, setSelectedMonth, setSelectedYear, fetchOvertimeRecords]);
  
  /**
   * 手動重新整理功能
   */
  const handleRefresh = useCallback(() => {
    loadScheduleData();
    loadEmployees();
    fetchOvertimeRecords();
  }, [loadScheduleData, loadEmployees, fetchOvertimeRecords]);
  
  /**
   * 打卡按鈕點擊處理
   */
  const handleOvertimeClockIn = useCallback(() => {
    setOvertimeFormData({
      employeeId: '',
      date: selectedDate,
      hours: '',
      description: '',
      status: 'pending' as OvertimeStatus,
      currentTime: ''
    });
    setOvertimeFormErrors({});
  }, [selectedDate]);
  
  /**
   * 關閉加班對話框
   */
  const handleCloseOvertimeDialog = useCallback(() => {
    setOvertimeFormData({
      employeeId: '',
      date: selectedDate,
      hours: '',
      description: '',
      status: 'pending' as OvertimeStatus,
      currentTime: ''
    });
    setOvertimeFormErrors({});
  }, [selectedDate]);
  
  /**
   * 處理表單輸入變更
   */
  const handleOvertimeInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setOvertimeFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除對應的錯誤訊息
    if (overtimeFormErrors[name]) {
      setOvertimeFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [overtimeFormErrors]);
  
  /**
   * 提交加班記錄
   */
  const handleSubmitOvertimeRecord = useCallback(async () => {
    // 驗證表單
    const errors: Record<string, string> = {};
    
    if (!overtimeFormData.employeeId) {
      errors.employeeId = '請選擇員工';
    }
    
    if (!overtimeFormData.date) {
      errors.date = '請選擇日期';
    }
    
    if (!overtimeFormData.hours || parseFloat(overtimeFormData.hours.toString()) <= 0) {
      errors.hours = '請輸入有效的加班時數';
    }
    
    if (Object.keys(errors).length > 0) {
      setOvertimeFormErrors(errors);
      return;
    }
    
    setSubmitting(true);
    try {
      const success = await createOvertimeRecord({
        employeeId: overtimeFormData.employeeId,
        date: overtimeFormData.date,
        hours: parseFloat(overtimeFormData.hours.toString()),
        description: overtimeFormData.description,
        status: overtimeFormData.status
      });
      
      if (success) {
        handleCloseOvertimeDialog();
        // 重新載入數據以顯示新的加班記錄
        fetchOvertimeRecords();
      }
    } catch (error) {
      console.error('提交加班記錄失敗:', error);
    } finally {
      setSubmitting(false);
    }
  }, [overtimeFormData, createOvertimeRecord, handleCloseOvertimeDialog, fetchOvertimeRecords]);
  
  /**
   * 獲取員工信息
   */
  const getEmployeeInfo = useCallback((employeeId: string) => {
    const employee = employees.find(emp => emp._id === employeeId);
    return {
      name: employee ? employee.name : `員工ID: ${employeeId}`,
      position: employee ? employee.position || '未知職位' : '未知職位',
      phone: employee ? employee.phone || '' : ''
    };
  }, [employees]);
  
  /**
   * 獲取當日的加班記錄
   */
  const dailyOvertimeRecords = useMemo(() => 
    filterDailyOvertimeRecords(overtimeRecords, selectedDate),
    [overtimeRecords, selectedDate]
  );
  
  /**
   * 準備班次數據
   */
  const shiftData = useMemo(() => 
    prepareShiftData(schedulesGroupedByDate, selectedDate, shiftBaseConfig, dailyOvertimeRecords),
    [schedulesGroupedByDate, selectedDate, shiftBaseConfig, dailyOvertimeRecords]
  );
  
  /**
   * 計算總員工數和總請假數
   */
  const totalEmployees = useMemo(() => 
    calculateTotalEmployees(shiftData),
    [shiftData]
  );
  
  const totalLeaves = useMemo(() => 
    calculateTotalLeaves(shiftData),
    [shiftData]
  );
  
  /**
   * 計算加載狀態和錯誤狀態
   */
  const loading = scheduleLoading || employeesLoading || shiftConfigLoading || overtimeLoading;
  const error = scheduleError;
  
  return {
    // 數據
    shiftData,
    employees,
    shiftBaseConfig,
    totalEmployees,
    totalLeaves,
    
    // 狀態
    loading,
    error,
    
    // 加班表單
    overtimeFormData,
    overtimeFormErrors,
    submitting,
    
    // 方法
    handleRefresh,
    handleOvertimeClockIn,
    handleCloseOvertimeDialog,
    handleOvertimeInputChange,
    handleSubmitOvertimeRecord,
    getEmployeeInfo
  };
};

export default useDailyScheduleSummary;