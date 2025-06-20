import { useState, useEffect, useCallback } from 'react';
import overtimeRecordService from '../services/overtimeRecordService';
import employeeService from '../services/employeeService';
import { Employee } from '../types/entities';

import {
  OvertimeRecord,
  OvertimeRecordCreateData,
  OvertimeRecordQueryParams,
  OvertimeRecordStatus
} from '../services/overtimeRecordService';

/**
 * 排班系統加班記錄介面
 */
interface ScheduleOvertimeRecord {
  _id: string;
  date: string | Date;
  shift: 'morning' | 'afternoon' | 'evening';
  employeeId: string | {
    _id: string;
    name: string;
    [key: string]: any;
  };
  employee?: {
    _id: string;
    name: string;
    [key: string]: any;
  };
  leaveType?: string;
  [key: string]: any;
}

/**
 * 排班系統加班記錄集合介面
 */
interface ScheduleOvertimeRecords {
  [employeeId: string]: ScheduleOvertimeRecord[];
}

/**
 * 統計數據介面
 */
interface SummaryData {
  employeeId: string;
  employeeName?: string;
  [key: string]: any;
}

/**
 * 擴展的加班記錄介面，用於前端顯示
 */
interface ExtendedOvertimeRecord extends Omit<OvertimeRecord, 'employeeId'> {
  employeeId: string | {
    _id: string;
    name: string;
    [key: string]: any;
  };
}

/**
 * 加班管理 Hook 參數介面
 */
interface OvertimeManagerProps {
  isAdmin?: boolean;
  employeeId?: string | null;
}

/**
 * 加班管理業務邏輯 Hook
 * 從 OvertimeManager 組件中提取的業務邏輯
 */
const useOvertimeManager = ({ isAdmin = false, employeeId = null }: OvertimeManagerProps) => {
  // 基本狀態
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [overtimeRecords, setOvertimeRecords] = useState<ExtendedOvertimeRecord[]>([]);
  const [scheduleOvertimeRecords, setScheduleOvertimeRecords] = useState<ScheduleOvertimeRecords>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});

  // 日期篩選狀態
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // 格式化日期為 YYYY-MM-DD 格式，避免時區問題
  const formatDateToYYYYMMDD = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 獲取員工列表
  const fetchEmployees = useCallback(async (): Promise<void> => {
    try {
      const response = await employeeService.getEmployees({ limit: 1000 });
      setEmployees(response.employees);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // 獲取加班記錄
  const fetchOvertimeRecords = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // 先獲取所有員工信息
      let allEmployees: Employee[] = [];
      try {
        const response = await employeeService.getEmployees({ limit: 1000 });
        allEmployees = response.employees || [];
        console.log(`獲取到 ${allEmployees.length} 名員工信息`);
      } catch (empErr) {
        console.error('獲取員工信息失敗:', empErr);
      }
      
      const params: Record<string, any> = {};
      if (employeeId) {
        params.employeeId = employeeId;
      }
      
      // 添加月份篩選
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      
      params.startDate = formatDateToYYYYMMDD(startDate);
      params.endDate = formatDateToYYYYMMDD(endDate);
      
      console.log(`查詢加班記錄: startDate=${params.startDate}, endDate=${params.endDate}`);
      
      const records = await overtimeRecordService.getOvertimeRecords(params);
      
      // 將 API 返回的記錄轉換為擴展格式
      const extendedRecords: ExtendedOvertimeRecord[] = records.map(record => {
        // 如果 employeeId 是字串，嘗試從員工列表中找到對應的員工
        if (typeof record.employeeId === 'string') {
          const employee = allEmployees.find(emp => emp._id === record.employeeId);
          if (employee) {
            return {
              ...record,
              employeeId: {
                _id: employee._id,
                name: employee.name,
                position: employee.position || '員工'
              }
            };
          }
        }
        
        // 如果找不到對應的員工，保持原樣
        return record as unknown as ExtendedOvertimeRecord;
      });
      
      setOvertimeRecords(extendedRecords);
      
      // 初始化展開狀態
      const expandedState: Record<string, boolean> = {};
      extendedRecords.forEach(record => {
        if (typeof record.employeeId === 'object' && record.employeeId?._id) {
          expandedState[record.employeeId._id] = false;
        }
      });
      
      setExpandedEmployees(expandedState);
      
      // 獲取月度統計數據
      await fetchMonthlyStats();
      
      // 獲取排班系統加班記錄
      await fetchScheduleOvertimeRecords();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedYear, selectedMonth, formatDateToYYYYMMDD]);

  // 獲取月度統計數據
  const fetchMonthlyStats = useCallback(async (): Promise<void> => {
    try {
      const statsParams = {
        year: selectedYear.toString(),
        month: (selectedMonth + 1).toString()
      };
      
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token }
      };
      
      const response = await fetch('/api/overtime-records/monthly-stats?' + new URLSearchParams(statsParams), {
        headers: config.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stats = await response.json();
      
      if (employeeId) {
        const employeeStats = stats.filter((stat: SummaryData) => stat.employeeId === employeeId);
        setSummaryData(employeeStats);
      } else {
        setSummaryData(stats);
      }
    } catch (statsError: any) {
      console.error('獲取月度統計失敗:', statsError);
      setError(`獲取月度統計失敗: ${statsError.message}`);
      setSummaryData([]);
    }
  }, [selectedYear, selectedMonth, employeeId]);

  // 獲取排班系統加班記錄
  const fetchScheduleOvertimeRecords = useCallback(async (): Promise<void> => {
    try {
      const startDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth, 1));
      const endDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth + 1, 0));
      
      const token = localStorage.getItem('token');
      const url = `/api/employee-schedules?startDate=${startDate}&endDate=${endDate}`;
      
      const response = await fetch(url, {
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const scheduleRecords = await response.json();
      
      // 過濾出加班記錄
      const overtimeSchedules = scheduleRecords.filter((record: ScheduleOvertimeRecord) => 
        record && record.leaveType === 'overtime'
      );
      
      // 按員工ID分組
      const groupedSchedules = overtimeSchedules.reduce((groups: ScheduleOvertimeRecords, record: ScheduleOvertimeRecord) => {
        let employeeIdValue: string;
        
        if (typeof record.employeeId === 'string') {
          employeeIdValue = record.employeeId;
        } else if (typeof record.employeeId === 'object' && record.employeeId._id) {
          employeeIdValue = record.employeeId._id;
        } else {
          return groups;
        }
        
        if (!groups[employeeIdValue]) {
          groups[employeeIdValue] = [];
        }
        groups[employeeIdValue].push(record);
        
        return groups;
      }, {});
      
      setScheduleOvertimeRecords(groupedSchedules);
    } catch (err: any) {
      console.error('獲取排班系統加班記錄失敗:', err);
    }
  }, [selectedYear, selectedMonth, formatDateToYYYYMMDD]);

  // 創建加班記錄
  const createOvertimeRecord = useCallback(async (recordData: Partial<ExtendedOvertimeRecord>): Promise<boolean> => {
    try {
      // 將擴展格式轉換為 API 需要的格式
      const apiData: OvertimeRecordCreateData = {
        employeeId: typeof recordData.employeeId === 'object' ? recordData.employeeId._id : recordData.employeeId,
        date: typeof recordData.date === 'string' ? recordData.date : formatDateToYYYYMMDD(recordData.date),
        hours: recordData.hours || 0,
        description: recordData.description,
        status: recordData.status
      };
      
      await overtimeRecordService.createOvertimeRecord(apiData);
      setSuccessMessage('加班記錄創建成功');
      await fetchOvertimeRecords();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchOvertimeRecords, formatDateToYYYYMMDD]);

  // 更新加班記錄
  const updateOvertimeRecord = useCallback(async (recordId: string, recordData: Partial<ExtendedOvertimeRecord>): Promise<boolean> => {
    try {
      // 將擴展格式轉換為 API 需要的格式
      const apiData: Partial<OvertimeRecordCreateData> = {};
      
      if (recordData.employeeId) {
        apiData.employeeId = typeof recordData.employeeId === 'object' ? recordData.employeeId._id : recordData.employeeId;
      }
      
      if (recordData.date) {
        apiData.date = typeof recordData.date === 'string' ? recordData.date : formatDateToYYYYMMDD(recordData.date);
      }
      
      if (recordData.hours !== undefined) {
        apiData.hours = recordData.hours;
      }
      
      if (recordData.description !== undefined) {
        apiData.description = recordData.description;
      }
      
      if (recordData.status) {
        apiData.status = recordData.status;
      }
      
      await overtimeRecordService.updateOvertimeRecord(recordId, apiData);
      setSuccessMessage('加班記錄更新成功');
      await fetchOvertimeRecords();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchOvertimeRecords, formatDateToYYYYMMDD]);

  // 刪除加班記錄
  const deleteOvertimeRecord = useCallback(async (recordId: string): Promise<boolean> => {
    try {
      await overtimeRecordService.deleteOvertimeRecord(recordId);
      setSuccessMessage('加班記錄已刪除');
      await fetchOvertimeRecords();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchOvertimeRecords]);

  // 切換員工展開狀態
  const toggleEmployeeExpanded = useCallback((employeeId: string): void => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  }, []);

  // 清除訊息
  const clearMessages = useCallback((): void => {
    setError(null);
    setSuccessMessage('');
  }, []);

  // 初始化和月份變更時加載數據
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await fetchEmployees();
        await fetchOvertimeRecords();
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [fetchEmployees, fetchOvertimeRecords]);

  // 自動清除訊息
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, clearMessages]);

  return {
    // 狀態
    loading,
    error,
    successMessage,
    overtimeRecords,
    scheduleOvertimeRecords,
    employees,
    summaryData,
    expandedEmployees,
    selectedMonth,
    selectedYear,
    
    // 操作方法
    setSelectedMonth,
    setSelectedYear,
    createOvertimeRecord,
    updateOvertimeRecord,
    deleteOvertimeRecord,
    toggleEmployeeExpanded,
    clearMessages,
    fetchOvertimeRecords,
    
    // 工具方法
    formatDateToYYYYMMDD
  };
};

export default useOvertimeManager;