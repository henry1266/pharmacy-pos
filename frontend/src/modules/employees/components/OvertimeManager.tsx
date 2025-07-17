import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Collapse,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { overtimeRecordService, employeeService } from '../core';
import { OvertimeRecord, OvertimeRecordStatus } from '../types';
import ManualOvertimeDialog from './overtime/ManualOvertimeDialog';
import TimeCalculationOvertimeDialog from './overtime/TimeCalculationOvertimeDialog';
import OvertimeRecordRow from './overtime/OvertimeRecordRow';
import useOvertimeData from '../../../hooks/useOvertimeData';
import { Employee } from '@pharmacy-pos/shared/types/entities';

// 定義簡化的員工介面，用於加班數據處理
interface OvertimeEmployee {
  _id: string;
  name: string;
  position?: string;
  [key: string]: any;
}

// 從 useOvertimeData 導入類型定義
interface ScheduleOvertimeRecord {
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

// 使用從 useOvertimeData 導入的 ScheduleOvertimeRecords 類型

// 定義加班統計數據介面
interface OvertimeStat {
  employeeId: string;
  overtimeHours: number;
  independentRecordCount?: number;
  scheduleRecordCount?: number;
  [key: string]: any;
}

// 定義處理後的加班記錄介面
interface ProcessedOvertimeGroup {
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

// 定義處理後的加班數據介面
interface ProcessedOvertimeData {
  [employeeId: string]: ProcessedOvertimeGroup;
}

// 定義手動輸入表單數據介面
interface ManualFormData {
  employeeId: string;
  date: string;
  hours: string | number;
  description: string;
  status: OvertimeRecordStatus;
}

// 定義時間計算表單數據介面
interface TimeCalculationFormData {
  employeeId: string;
  date: string;
  hours: string | number;
  description: string;
  status: OvertimeRecordStatus;
  currentTime: string;
}

// 定義表單錯誤介面
interface FormErrors {
  employeeId?: string;
  date?: string;
  hours?: string;
  description?: string;
  status?: string;
  [key: string]: string | undefined;
}

// 定義排班加班記錄分組介面
interface ScheduleOvertimeRecords {
  [employeeId: string]: ScheduleOvertimeRecord[];
}

// 定義展開狀態介面
interface ExpandedEmployees {
  [employeeId: string]: boolean;
}

// 定義元件 Props 介面
interface OvertimeManagerProps {
  isAdmin?: boolean;
  employeeId?: string | null;
}

/**
 * 加班管理組件
 * 用於管理員工的加班記錄
 * 重新設計，移除複雜的加班統計計算邏輯
 */
const OvertimeManager: React.FC<OvertimeManagerProps> = ({ isAdmin = false, employeeId = null }) => {
  // 狀態
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [expandedEmployees, setExpandedEmployees] = useState<ExpandedEmployees>({});
  const [scheduleOvertimeRecords, setScheduleOvertimeRecords] = useState<ScheduleOvertimeRecords>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);
  const [manualDialogOpen, setManualDialogOpen] = useState<boolean>(false);
  const [timeCalculationDialogOpen, setTimeCalculationDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  
  // 月份篩選狀態
  const currentDate = new Date();
  // 預設選擇當前月份
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 當前月份
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear()); // 當前年份
  const [manualFormData, setManualFormData] = useState<ManualFormData>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    status: 'pending'
  });
  
  const [timeCalculationFormData, setTimeCalculationFormData] = useState<TimeCalculationFormData>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    status: 'pending',
    currentTime: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<OvertimeStat[]>([]);

  // 使用加班數據處理 Hook
  const { processedOvertimeData, generateMergedRecords } = useOvertimeData(
    overtimeRecords as any,
    scheduleOvertimeRecords,
    summaryData,
    employees,
    selectedMonth
  );

  // 處理函數
  const handleApproveRecord = async (record: OvertimeRecord): Promise<void> => {
    try {
      await overtimeRecordService.updateOvertimeRecord(record._id, {
        status: 'approved'
      });
      setSuccessMessage('加班記錄已核准');
      fetchOvertimeRecords();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRejectRecord = async (record: OvertimeRecord): Promise<void> => {
    try {
      await overtimeRecordService.updateOvertimeRecord(record._id, {
        status: 'rejected'
      });
      setSuccessMessage('加班記錄已拒絕');
      fetchOvertimeRecords();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditRecordClick = (record: OvertimeRecord): void => {
    handleOpenEditDialog(record);
  };

  const handleDeleteRecordClick = (record: OvertimeRecord): void => {
    handleOpenDeleteDialog(record);
  };

  const handleApproveClick = (record: OvertimeRecord): void => {
    setSelectedRecord(record);
    handleApproveRecord(record);
  };

  const handleRejectClick = (record: OvertimeRecord): void => {
    setSelectedRecord(record);
    handleRejectRecord(record);
  };

  // 獲取加班記錄
  const fetchOvertimeRecords = async (): Promise<void> => {
    setLoading(true);
    try {
      // 先獲取所有員工信息，用於後續匹配
      let allEmployees: Employee[] = [];
      try {
        const response = await employeeService.getAllEmployees({ limit: 1000 });
        allEmployees = response?.employees || [];
      } catch (empErr: any) {
        console.error('獲取員工信息失敗:', empErr);
      }
      
      const params: Record<string, any> = {};
      if (employeeId) {
        params.employeeId = employeeId;
      }
      
      // 添加月份篩選 - 只查詢特定月份的數據
      let startDate: Date, endDate: Date;
      
      // 查詢特定月份的數據
      startDate = new Date(selectedYear, selectedMonth, 1); // 該月1日
      // 計算下個月的第0天，即當月的最後一天
      endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      
      // 使用本地時區格式化日期，避免時區問題
      params.startDate = formatDateToYYYYMMDD(startDate);
      params.endDate = formatDateToYYYYMMDD(endDate);
      
      // 直接使用 axios 調用 API，繞過 service 層可能的問題
      let records: any[] = [];
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { 'x-auth-token': token },
          params
        };
        
        const response = await axios.get('/api/overtime-records', config);
        
        if (response.data.success && Array.isArray(response.data.data)) {
          records = response.data.data;
          console.log(`✓ 成功獲取 ${records.length} 筆獨立加班記錄`);
          
          // 轉換數據格式，確保 employee 字段正確
          records = records.map(record => ({
            ...record,
            employee: record.employeeId || record.employee
          }));
          
        } else {
          console.warn('API 響應格式異常:', response.data);
          records = [];
        }
        
        setOvertimeRecords(records);
      } catch (recordsError) {
        console.error('獲取獨立加班記錄失敗:', recordsError);
        records = [];
        setOvertimeRecords([]);
      }
      
      // 初始化展開狀態 - 同時考慮獨立加班記錄和排班系統加班記錄
      const expandedState: ExpandedEmployees = {};
      
      // 處理獨立加班記錄
      records.forEach(record => {
        if (record.employee && typeof record.employee === 'object' && record.employee._id) {
          expandedState[record.employee._id] = false;
        }
      });
      
      // 處理排班系統加班記錄
      Object.keys(scheduleOvertimeRecords).forEach(empId => {
        expandedState[empId] = false;
      });
      
      // 處理統計數據中的員工ID
      if (Array.isArray(summaryData)) {
        summaryData.forEach(stat => {
          if (stat.employeeId) {
            expandedState[stat.employeeId] = false;
          }
        });
      }
      
      console.log("初始化展開狀態:", expandedState);
      setExpandedEmployees(expandedState);
      
      // 獲取加班時數統計（包含排班系統加班記錄）- 添加更詳細的錯誤處理
      // 使用現有的 API 路徑
      const statsUrl = '/api/overtime-records/monthly-stats';
      const statsParams: Record<string, any> = {
        year: selectedYear,
        month: selectedMonth + 1
      };
      
      console.log(`嘗試獲取月度加班統計: 年份=${selectedYear}, 月份=${selectedMonth + 1}`);
      
      let stats: OvertimeStat[] = [];
      try {
        // 直接使用axios進行請求，以便獲取完整的響應
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          },
          params: statsParams
        };
        
        console.log(`直接發送請求: ${statsUrl}`, config.params);
        
        const response = await axios.get(statsUrl, config);
        console.log(`API響應狀態: ${response.status}`);
        console.log(`API響應數據:`, response.data);
        
        // 檢查 API 響應格式
        if (response.data.success && response.data.data) {
          stats = response.data.data as OvertimeStat[];
        } else {
          throw new Error('獲取月度加班統計失敗');
        }
        console.log(`獲取到月度加班統計:`, stats);
      } catch (statsError: any) {
        console.error('獲取月度加班統計失敗:', statsError);
        console.error('錯誤詳情:', statsError.response?.data ?? statsError.message);
        setError(`獲取月度加班統計失敗: ${statsError.response?.data?.message ?? statsError.message}`);
        stats = []; // 設置為空數組，避免後續處理出錯
      }
      
      // 如果是特定員工視圖，則過濾出該員工的統計數據
      if (employeeId) {
        const employeeStats = stats.filter(stat => stat.employeeId === employeeId);
        setSummaryData(employeeStats);
      } else {
        setSummaryData(stats);
      }
      
      // 獲取排班系統加班記錄
      try {
        // 構建查詢參數 - 只查詢特定月份的數據
        let startDate, endDate;
        
        // 查詢特定月份的數據
        startDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth, 1)); // 該月1日
        // 計算下個月的第0天，即當月的最後一天
        endDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth + 1, 0));
        
        console.log(`嘗試獲取排班系統加班記錄: ${startDate} 至 ${endDate}, 年份: ${selectedYear}`);
        
        // 獲取排班系統加班記錄 - 添加更詳細的錯誤處理
        let scheduleRecords: any[] = [];
        try {
          // 直接使用axios進行請求，以便獲取完整的響應
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              'x-auth-token': token
            }
          };
          const url = `/api/employee-schedules?startDate=${startDate}&endDate=${endDate}`;
          console.log(`直接發送請求: ${url}`);
          
          const response = await axios.get(url, config);
          console.log(`API響應狀態: ${response.status}`);
          
          // 檢查 API 響應格式
          let responseData: any[];
          if (response.data.success && response.data.data) {
            responseData = response.data.data;
          } else if (Array.isArray(response.data)) {
            // 向後兼容舊格式
            responseData = response.data;
          } else {
            throw new Error('獲取排班記錄失敗');
          }
          
          // 詳細記錄每條數據的結構
          if (responseData && Array.isArray(responseData)) {
            console.log(`獲取到排班記錄數量: ${responseData.length}`);
            responseData.forEach((record, idx) => {
              console.log(`排班記錄 ${idx + 1}:`, record);
              if (record.employeeId) {
                console.log(`  - employeeId類型: ${typeof record.employeeId}`);
                if (typeof record.employeeId === 'object') {
                  console.log(`  - employeeId內容:`, record.employeeId);
                  if (record.employeeId.name) {
                    console.log(`  - 員工姓名: ${record.employeeId.name}`);
                  }
                }
              }
            });
          }
          
          scheduleRecords = responseData;
        } catch (scheduleError: any) {
          console.error('獲取排班記錄失敗:', scheduleError);
          console.error('錯誤詳情:', scheduleError.response?.data ?? scheduleError.message);
          setError(`獲取排班記錄失敗: ${scheduleError.response?.data?.message ?? scheduleError.message}`);
          // 不提前返回，繼續處理其他邏輯
          scheduleRecords = []; // 設置為空數組，繼續處理
        }
        
        // 檢查是否有排班記錄
        if (scheduleRecords.length === 0) {
          console.log(`${startDate} 至 ${endDate} 期間沒有排班記錄`);
          // 設置空的分組記錄
          setScheduleOvertimeRecords({});
          // 不提前返回，繼續處理其他邏輯
        }
        
        // 詳細檢查每條記錄的格式和內容
        console.log("詳細檢查排班記錄:");
        scheduleRecords.forEach((record, index) => {
          console.log(`記錄 ${index + 1}:`, record);
          console.log(`  - ID: ${record._id}`);
          console.log(`  - 日期: ${record.date}`);
          console.log(`  - 班次: ${record.shift}`);
          console.log(`  - 員工ID: `, record.employeeId);
          console.log(`  - 請假類型: ${record.leaveType}`);
        });
        
        // 過濾出加班記錄 (leaveType === 'overtime')
        const overtimeSchedules = scheduleRecords.filter(record => {
          // 檢查記錄是否有效
          if (!record || typeof record !== 'object') {
            console.error(`[診斷] 排班記錄格式不正確:`, record);
            return false;
          }
          
          // 檢查記錄ID
          if (!record._id) {
            console.error(`[診斷] 排班記錄缺少_id字段:`, record);
            return false;
          }
          
          // 檢查 leaveType 字段
          const isOvertime = record.leaveType === 'overtime';
          console.log(`[診斷] 記錄 ${record._id} 是否為加班: ${isOvertime}, leaveType: ${record.leaveType ?? '未設置'}`);
          
          return isOvertime;
        });
        console.log(`[診斷] 過濾後加班記錄數量: ${overtimeSchedules.length}`, overtimeSchedules);
        
        // 檢查是否有加班記錄
        if (overtimeSchedules.length === 0) {
          console.log(`${startDate} 至 ${endDate} 期間沒有加班記錄`);
          // 設置空的分組記錄
          setScheduleOvertimeRecords({});
          // 不提前返回，繼續處理其他邏輯
        }
        
        // 按員工ID分組 - 處理不同的employeeId格式，增強健壯性
        const groupedSchedules: ScheduleOvertimeRecords = overtimeSchedules.reduce((groups: ScheduleOvertimeRecords, record) => {
          console.log(`處理加班記錄:`, record);
          
          try {
            // 獲取員工ID，處理不同的格式
            let employeeIdValue: string;
            
            if (!record.employeeId) {
              console.error(`記錄 ${record._id} 沒有employeeId字段`);
              return groups;
            }
            
            if (typeof record.employeeId === 'string') {
              // 如果employeeId是字符串，直接使用
              employeeIdValue = record.employeeId;
              console.log(`記錄 ${record._id} 的employeeId是字符串: ${employeeIdValue}`);
            } else if (typeof record.employeeId === 'object') {
              if (record.employeeId._id) {
                // 如果employeeId是對象且有_id字段，使用_id
                employeeIdValue = record.employeeId._id;
                console.log(`記錄 ${record._id} 的employeeId是對象，_id: ${employeeIdValue}`);
              } else if (record.employeeId.$oid) {
                // 如果employeeId是MongoDB格式的對象，使用$oid
                employeeIdValue = record.employeeId.$oid;
                console.log(`記錄 ${record._id} 的employeeId是MongoDB格式，$oid: ${employeeIdValue}`);
              } else {
                // 嘗試將整個對象轉為字符串作為ID
                employeeIdValue = JSON.stringify(record.employeeId);
                console.log(`記錄 ${record._id} 的employeeId是對象，但沒有_id或$oid字段，使用字符串化值: ${employeeIdValue}`);
              }
            } else {
              // 嘗試將任何類型轉為字符串
              employeeIdValue = String(record.employeeId);
              console.log(`記錄 ${record._id} 的employeeId格式不正確: ${typeof record.employeeId}，使用字符串化值: ${employeeIdValue}`);
            }
            
            // 使用獲取的employeeIdValue進行分組
            if (!groups[employeeIdValue]) {
              groups[employeeIdValue] = [];
            }
            groups[employeeIdValue].push(record);
          } catch (err) {
            console.error(`處理記錄 ${record._id ?? '未知ID'} 時發生錯誤:`, err);
          }
          
          return groups;
        }, {});
        
        console.log("分組後的加班記錄:", groupedSchedules);
        
        setScheduleOvertimeRecords(groupedSchedules);
      } catch (err) {
        console.error('獲取排班系統加班記錄失敗:', err);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 獲取員工列表
  const fetchEmployees = async (): Promise<void> => {
    try {
      const response = await employeeService.getAllEmployees({ limit: 1000 });
      // 確保 response.employees 是陣列
      if (response && Array.isArray(response.employees)) {
        setEmployees(response.employees);
      } else {
        console.warn('員工資料不是陣列格式:', response);
        setEmployees([]);
      }
    } catch (err: any) {
      console.error('獲取員工資訊失敗:', err);
      setError(err.message);
      // 確保在錯誤情況下 employees 仍然是空陣列
      setEmployees([]);
    }
  };

  // 初始化和月份變更時加載數據
  useEffect(() => {
    const loadAllData = async (): Promise<void> => {
      setLoading(true);
      try {
        await fetchEmployees();
        await fetchOvertimeRecords();
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [employeeId, selectedYear, selectedMonth]);

  // 處理手動輸入表單變更
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent): void => {
    const { name, value } = e.target;
    setManualFormData({
      ...manualFormData,
      [name]: value
    });

    // 清除對應欄位的錯誤訊息
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // 處理時間計算表單變更
  const handleTimeCalculationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent): void => {
    const { name, value } = e.target;
    setTimeCalculationFormData({
      ...timeCalculationFormData,
      [name]: value
    });

    // 清除對應欄位的錯誤訊息
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // 驗證手動輸入表單
  const validateManualForm = (): boolean => {
    const errors: FormErrors = {};

    if (!manualFormData.employeeId) {
      errors.employeeId = '請選擇員工';
    }

    if (!manualFormData.date) {
      errors.date = '請選擇日期';
    }

    if (!manualFormData.hours) {
      errors.hours = '請輸入加班時數';
    } else if (isNaN(Number(manualFormData.hours)) || Number(manualFormData.hours) <= 0 || Number(manualFormData.hours) > 24) {
      errors.hours = '加班時數必須在 0.5 到 24 小時之間';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 驗證時間計算表單
  const validateTimeCalculationForm = (): boolean => {
    const errors: FormErrors = {};

    if (!timeCalculationFormData.employeeId) {
      errors.employeeId = '請選擇員工';
    }

    if (!timeCalculationFormData.date) {
      errors.date = '請選擇日期';
    }

    if (!timeCalculationFormData.hours) {
      errors.hours = '請輸入加班時數';
    } else if (isNaN(Number(timeCalculationFormData.hours)) || Number(timeCalculationFormData.hours) <= 0 || Number(timeCalculationFormData.hours) > 24) {
      errors.hours = '加班時數必須在 0.5 到 24 小時之間';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 開啟手動輸入對話框
  const handleOpenManualDialog = (): void => {
    setManualFormData({
      employeeId: employeeId ?? '',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      description: '',
      status: 'pending'
    });
    setFormErrors({});
    setManualDialogOpen(true);
  };

  // 開啟時間計算對話框
  const handleOpenTimeCalculationDialog = (): void => {
    setTimeCalculationFormData({
      employeeId: employeeId ?? '',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      description: '',
      status: 'pending',
      currentTime: ''
    });
    setFormErrors({});
    setTimeCalculationDialogOpen(true);
  };

  // 開啟編輯加班記錄對話框
  const handleOpenEditDialog = (record: OvertimeRecord): void => {
    setSelectedRecord(record);
    const empId = record.employee && typeof record.employee === 'object' ? record.employee._id : record.employeeId;
    setManualFormData({
      employeeId: typeof empId === 'string' ? empId : '',
      date: new Date(record.date).toISOString().split('T')[0],
      hours: record.hours,
      description: record.description || '',
      status: record.status
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  // 開啟刪除加班記錄對話框
  const handleOpenDeleteDialog = (record: OvertimeRecord): void => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  // 關閉所有對話框
  const handleCloseDialogs = (): void => {
    setManualDialogOpen(false);
    setTimeCalculationDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedRecord(null);
  };

  // 創建手動輸入加班記錄
  const handleCreateManualRecord = async (): Promise<void> => {
    if (!validateManualForm()) return;

    setSubmitting(true);
    try {
      await overtimeRecordService.createOvertimeRecord({
        employeeId: manualFormData.employeeId,
        date: manualFormData.date,
        hours: parseFloat(manualFormData.hours as string),
        description: manualFormData.description,
        status: manualFormData.status
      });

      setSuccessMessage('加班記錄創建成功');
      handleCloseDialogs();
      fetchOvertimeRecords();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 創建時間計算加班記錄
  const handleCreateTimeCalculationRecord = async (): Promise<void> => {
    if (!validateTimeCalculationForm()) return;

    setSubmitting(true);
    try {
      await overtimeRecordService.createOvertimeRecord({
        employeeId: timeCalculationFormData.employeeId,
        date: timeCalculationFormData.date,
        hours: parseFloat(timeCalculationFormData.hours as string),
        description: timeCalculationFormData.description,
        status: timeCalculationFormData.status
      });

      setSuccessMessage('加班記錄創建成功');
      handleCloseDialogs();
      fetchOvertimeRecords();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 更新加班記錄
  const handleUpdateRecord = async (): Promise<void> => {
    if (!validateManualForm()) return;

    setSubmitting(true);
    try {
      if (selectedRecord) {
        await overtimeRecordService.updateOvertimeRecord(selectedRecord._id, {
          employeeId: manualFormData.employeeId,
          date: manualFormData.date,
          hours: parseFloat(manualFormData.hours as string),
          description: manualFormData.description,
          status: manualFormData.status
        });

        setSuccessMessage('加班記錄更新成功');
        handleCloseDialogs();
        fetchOvertimeRecords();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 刪除加班記錄
  const handleDeleteRecord = async (): Promise<void> => {
    setSubmitting(true);
    try {
      if (selectedRecord) {
        await overtimeRecordService.deleteOvertimeRecord(selectedRecord._id);

        setSuccessMessage('加班記錄已刪除');
        handleCloseDialogs();
        fetchOvertimeRecords();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 清除成功訊息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 清除錯誤訊息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 獲取狀態顯示文字
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return '待審核';
      case 'approved':
        return '已核准';
      case 'rejected':
        return '已拒絕';
      default:
        return status;
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // 格式化日期顯示
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
  };
  
  // 格式化日期為 YYYY-MM-DD 格式，避免時區問題
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const monthNum = date.getMonth() + 1;
    const dayNum = date.getDate();
    const month = monthNum < 10 ? `0${monthNum}` : monthNum.toString();
    const day = dayNum < 10 ? `0${dayNum}` : dayNum.toString();
    return `${year}-${month}-${day}`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            加班記錄管理
          </Typography>
          {isAdmin && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenManualDialog}
              >
                手動輸入加班
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenTimeCalculationDialog}
              >
                時間計算加班
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* 年份與月份篩選器 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <Typography variant="subtitle2">篩選：</Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="year-select-label">年份</InputLabel>
            <Select
              labelId="year-select-label"
              value={selectedYear}
              label="年份"
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              size="small"
            >
              <MenuItem value={2024}>2024</MenuItem>
              <MenuItem value={2025}>2025</MenuItem>
              <MenuItem value={2026}>2026</MenuItem>
              <MenuItem value={2027}>2027</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="month-select-label">月份</InputLabel>
            <Select
              labelId="month-select-label"
              value={selectedMonth}
              label="月份"
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              size="small"
            >
              <MenuItem value={0}>1月</MenuItem>
              <MenuItem value={1}>2月</MenuItem>
              <MenuItem value={2}>3月</MenuItem>
              <MenuItem value={3}>4月</MenuItem>
              <MenuItem value={4}>5月</MenuItem>
              <MenuItem value={5}>6月</MenuItem>
              <MenuItem value={6}>7月</MenuItem>
              <MenuItem value={7}>8月</MenuItem>
              <MenuItem value={8}>9月</MenuItem>
              <MenuItem value={9}>10月</MenuItem>
              <MenuItem value={10}>11月</MenuItem>
              <MenuItem value={11}>12月</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 加班記錄列表 */}
        <Typography variant="subtitle1" gutterBottom>
          {`${selectedYear}年 ${selectedMonth + 1}月 加班記錄`}
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>載入中...</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="5%"></TableCell>
                  <TableCell>員工姓名</TableCell>
                  <TableCell>獨立加班時數</TableCell>
                  <TableCell>排班加班時數</TableCell>
                  <TableCell>加班總時數</TableCell>
                  <TableCell>記錄數量</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* 診斷信息 */}
                <Box component="tr">
                  <TableCell colSpan={6}>
                    <Typography variant="caption" color="text.secondary">
                      獨立加班記錄: {overtimeRecords.length} 筆,
                      排班加班記錄: {(() => {
                        let count = 0;
                        for (const key in scheduleOvertimeRecords) {
                          if (scheduleOvertimeRecords.hasOwnProperty(key)) {
                            count += scheduleOvertimeRecords[key].length;
                          }
                        }
                        return count;
                      })()} 筆,
                      統計數據: {summaryData.length} 筆
                    </Typography>
                  </TableCell>
                </Box>
                
                {overtimeRecords.length === 0 && summaryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">
                        {error ? (
                          // 如果有錯誤，顯示錯誤信息
                          `查詢出錯: ${error}`
                        ) : (
                          // 提供更明確的指引
                          <>
                            沒有找到加班記錄。請嘗試選擇其他月份（如 1-8 月）查看加班記錄。
                            <br />
                            <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                              根據系統記錄，2025年1月至8月有加班數據。
                            </Typography>
                          </>
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    const entries: Array<[string, ProcessedOvertimeGroup]> = [];
                    for (const key in processedOvertimeData) {
                      if (processedOvertimeData.hasOwnProperty(key)) {
                        entries.push([key, processedOvertimeData[key]]);
                      }
                    }
                    return entries;
                  })().map(([employeeId, group]) => {
                    // 查找對應的排班系統加班統計 - 增強健壯性
                    console.log(`嘗試查找員工 ${employeeId} 的加班統計，summaryData:`, summaryData);
                    
                    // 簡化匹配邏輯，避免複雜的類型檢查
                    const scheduleStats = Array.isArray(summaryData) ? summaryData.find(stat => {
                      // 直接匹配 employeeId 字符串
                      return stat.employeeId === employeeId;
                    }) : undefined;
                    
                    console.log(`員工 ${employeeId} 的加班統計:`, scheduleStats);
                    
                    if (scheduleStats) {
                      // 使用統計數據中的總時數，但不覆蓋 hook 中已計算的獨立加班時數
                      const totalFromStats = scheduleStats.overtimeHours;
                      const scheduleHoursFromStats = totalFromStats - group.independentHours;
                      
                      // 如果統計數據中的排班時數與 hook 計算的不一致，使用統計數據
                      if (scheduleHoursFromStats !== group.scheduleHours && scheduleHoursFromStats >= 0) {
                        console.log(`員工 ${employeeId} 排班時數不一致: hook計算=${group.scheduleHours}, 統計數據=${scheduleHoursFromStats}`);
                        group.scheduleHours = scheduleHoursFromStats;
                      }
                      
                      // 重新計算總時數
                      group.totalHours = group.independentHours + group.scheduleHours;
                      
                      // 使用 scheduleRecords.length 代替 scheduleRecordCount
                      const scheduleRecordsCount = scheduleStats.scheduleRecordCount ?? 0;
                      // 添加一個臨時屬性來存儲排班記錄數量
                      (group as any).scheduleRecordCount = scheduleRecordsCount;
                    } else {
                      // 如果沒有統計數據，使用 hook 中計算的數據
                      console.log(`警告: 未找到員工 ${employeeId} 的加班統計數據，使用 hook 計算的數據`);
                      console.log(`  - 獨立加班時數: ${group.independentHours}`);
                      console.log(`  - 排班加班時數: ${group.scheduleHours}`);
                      console.log(`  - 總時數: ${group.totalHours}`);
                      
                      // 確保總時數正確計算
                      group.totalHours = group.independentHours + group.scheduleHours;
                    }
                    
                    return (
                      <React.Fragment key={employeeId}>
                        {/* 員工主行 */}
                        <TableRow
                          sx={{
                            '& > *': { borderBottom: 'unset' },
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setExpandedEmployees({
                            ...expandedEmployees,
                            [employeeId]: !expandedEmployees[employeeId]
                          })}
                        >
                          <TableCell>
                            <IconButton
                              size="small"
                              aria-label={expandedEmployees[employeeId] ? "收起" : "展開"}
                            >
                              {expandedEmployees[employeeId] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell component="th" scope="row">
                            <Typography variant="subtitle1" fontWeight="bold">
                              {group.employee.name ?? (() => {
                                const monthNum = selectedMonth + 1;
                                const monthStr = monthNum < 10 ? `0${monthNum}` : monthNum.toString();
                                return `員工${monthStr}`;
                              })()}
                            </Typography>
                          </TableCell>
                          <TableCell>{group.independentHours.toFixed(1)} 小時</TableCell>
                          <TableCell>{group.scheduleHours.toFixed(1)} 小時</TableCell>
                          <TableCell>{group.totalHours.toFixed(1)} 小時</TableCell>
                          <TableCell>
                            {group.records.length} 筆獨立 + {group.scheduleRecords.length} 筆排班
                          </TableCell>
                        </TableRow>
                        
                        {/* 詳細記錄 (可收折) */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                            <Collapse in={expandedEmployees[employeeId]} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 1, mb: 3 }}>
                                {/* 合併的加班記錄詳細列表 */}
                                <Table size="small" aria-label="加班記錄明細">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>類型</TableCell>
                                      <TableCell>日期</TableCell>
                                      <TableCell>時段/原因</TableCell>
                                      <TableCell>加班時數</TableCell>
                                      <TableCell>狀態</TableCell>
                                      {isAdmin && <TableCell>操作</TableCell>}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {(() => {
                                      // 添加調試信息
                                      console.log(`[調試] 員工 ${employeeId} (${group.employee.name}) 的數據:`);
                                      console.log(`  - 獨立加班記錄數量: ${group.records.length}`);
                                      console.log(`  - 獨立加班記錄:`, group.records);
                                      console.log(`  - 排班加班記錄數量: ${group.scheduleRecords.length}`);
                                      console.log(`  - 排班加班記錄:`, group.scheduleRecords);
                                      
                                      const allRecords = generateMergedRecords(group, employeeId);
                                      console.log(`  - 合併後記錄數量: ${allRecords.length}`);
                                      console.log(`  - 合併後記錄:`, allRecords);
                                      
                                      if (allRecords.length === 0) {
                                        return (
                                          <TableRow>
                                            <TableCell colSpan={isAdmin ? 6 : 5} align="center">
                                              <Typography color="textSecondary">
                                                沒有找到加班記錄
                                                <br />
                                                <Typography variant="caption" color="error">
                                                  調試: 獨立記錄 {group.records.length} 筆, 排班記錄 {group.scheduleRecords.length} 筆
                                                </Typography>
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      }
                                      
                                      return allRecords.map(record => (
                                        <OvertimeRecordRow
                                          key={record.id}
                                          record={record}
                                          isAdmin={isAdmin}
                                          onEdit={handleEditRecordClick}
                                          onDelete={handleDeleteRecordClick}
                                          onApprove={handleApproveClick}
                                          onReject={handleRejectClick}
                                          formatDate={formatDate}
                                          getStatusText={getStatusText}
                                          getStatusColor={getStatusColor}
                                        />
                                      ));
                                    })()}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 手動輸入加班記錄對話框 */}
      <ManualOvertimeDialog
        open={manualDialogOpen}
        onClose={handleCloseDialogs}
        title="手動輸入加班記錄"
        formData={manualFormData}
        formErrors={formErrors}
        employees={employees}
        employeeId={employeeId}
        isAdmin={isAdmin}
        submitting={submitting}
        onInputChange={handleManualInputChange}
        onSubmit={handleCreateManualRecord}
        submitButtonText="新增"
      />

      {/* 時間計算加班記錄對話框 */}
      <TimeCalculationOvertimeDialog
        open={timeCalculationDialogOpen}
        onClose={handleCloseDialogs}
        title="時間計算加班記錄"
        formData={timeCalculationFormData}
        formErrors={formErrors}
        employees={employees}
        employeeId={employeeId}
        isAdmin={isAdmin}
        submitting={submitting}
        onInputChange={handleTimeCalculationInputChange}
        onSubmit={handleCreateTimeCalculationRecord}
        submitButtonText="新增"
      />

      {/* 編輯加班記錄對話框 */}
      <ManualOvertimeDialog
        open={editDialogOpen}
        onClose={handleCloseDialogs}
        title="編輯加班記錄"
        formData={manualFormData}
        formErrors={formErrors}
        employees={employees}
        employeeId={employeeId}
        isAdmin={isAdmin}
        submitting={submitting}
        onInputChange={handleManualInputChange}
        onSubmit={handleUpdateRecord}
        submitButtonText="更新"
      />

      {/* 刪除加班記錄對話框 */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>刪除加班記錄</DialogTitle>
        <DialogContent>
          <Typography>
            您確定要刪除這筆加班記錄嗎？此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>取消</Button>
          <Button
            onClick={handleDeleteRecord}
            disabled={submitting}
            variant="contained"
            color="error"
          >
            {submitting ? '處理中...' : '刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OvertimeManager;