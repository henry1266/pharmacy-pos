import { useState, useEffect, useCallback } from 'react';
import overtimeRecordService from '../services/overtimeRecordService';
import employeeService from '../services/employeeService';

/**
 * 加班管理業務邏輯 Hook
 * 從 OvertimeManager 組件中提取的業務邏輯
 */
const useOvertimeManager = ({ isAdmin = false, employeeId = null }) => {
  // 基本狀態
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [scheduleOvertimeRecords, setScheduleOvertimeRecords] = useState({});
  const [employees, setEmployees] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [expandedEmployees, setExpandedEmployees] = useState({});

  // 日期篩選狀態
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // 格式化日期為 YYYY-MM-DD 格式，避免時區問題
  const formatDateToYYYYMMDD = useCallback((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 獲取員工列表
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getEmployees({ limit: 1000 });
      setEmployees(response.employees);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // 獲取加班記錄
  const fetchOvertimeRecords = useCallback(async () => {
    setLoading(true);
    try {
      // 先獲取所有員工信息
      let allEmployees = [];
      try {
        const response = await employeeService.getEmployees({ limit: 1000 });
        allEmployees = response.employees || [];
        console.log(`獲取到 ${allEmployees.length} 名員工信息`);
      } catch (empErr) {
        console.error('獲取員工信息失敗:', empErr);
      }
      
      const params = {};
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
      setOvertimeRecords(records);
      
      // 初始化展開狀態
      const expandedState = {};
      records.forEach(record => {
        if (record.employeeId?._id) {
          expandedState[record.employeeId._id] = false;
        }
      });
      
      setExpandedEmployees(expandedState);
      
      // 獲取月度統計數據
      await fetchMonthlyStats();
      
      // 獲取排班系統加班記錄
      await fetchScheduleOvertimeRecords();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedYear, selectedMonth, formatDateToYYYYMMDD]);

  // 獲取月度統計數據
  const fetchMonthlyStats = useCallback(async () => {
    try {
      const statsParams = {
        year: selectedYear,
        month: selectedMonth + 1
      };
      
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token },
        params: statsParams
      };
      
      const response = await fetch('/api/overtime-records/monthly-stats?' + new URLSearchParams(statsParams), {
        headers: config.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stats = await response.json();
      
      if (employeeId) {
        const employeeStats = stats.filter(stat => stat.employeeId === employeeId);
        setSummaryData(employeeStats);
      } else {
        setSummaryData(stats);
      }
    } catch (statsError) {
      console.error('獲取月度統計失敗:', statsError);
      setError(`獲取月度統計失敗: ${statsError.message}`);
      setSummaryData([]);
    }
  }, [selectedYear, selectedMonth, employeeId]);

  // 獲取排班系統加班記錄
  const fetchScheduleOvertimeRecords = useCallback(async () => {
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
      const overtimeSchedules = scheduleRecords.filter(record => 
        record && record.leaveType === 'overtime'
      );
      
      // 按員工ID分組
      const groupedSchedules = overtimeSchedules.reduce((groups, record) => {
        let employeeIdValue;
        
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
    } catch (err) {
      console.error('獲取排班系統加班記錄失敗:', err);
    }
  }, [selectedYear, selectedMonth, formatDateToYYYYMMDD]);

  // 創建加班記錄
  const createOvertimeRecord = useCallback(async (recordData) => {
    try {
      await overtimeRecordService.createOvertimeRecord(recordData);
      setSuccessMessage('加班記錄創建成功');
      await fetchOvertimeRecords();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fetchOvertimeRecords]);

  // 更新加班記錄
  const updateOvertimeRecord = useCallback(async (recordId, recordData) => {
    try {
      await overtimeRecordService.updateOvertimeRecord(recordId, recordData);
      setSuccessMessage('加班記錄更新成功');
      await fetchOvertimeRecords();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fetchOvertimeRecords]);

  // 刪除加班記錄
  const deleteOvertimeRecord = useCallback(async (recordId) => {
    try {
      await overtimeRecordService.deleteOvertimeRecord(recordId);
      setSuccessMessage('加班記錄已刪除');
      await fetchOvertimeRecords();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fetchOvertimeRecords]);

  // 切換員工展開狀態
  const toggleEmployeeExpanded = useCallback((employeeId) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  }, []);

  // 清除訊息
  const clearMessages = useCallback(() => {
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