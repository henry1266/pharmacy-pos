import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  SelectChangeEvent
} from '@mui/material';
import axios from 'axios';
import ShiftSection, {
  Employee,
  Schedules,
  ScheduleData
} from './ShiftSection';

/**
 * API 響應介面
 */
interface EmployeesApiResponse {
  employees: Employee[];
  [key: string]: any;
}

/**
 * 快速選擇面板 Props 介面
 */
interface QuickSelectPanelProps {
  date: string;
  schedules: Schedules;
  onAddSchedule: (scheduleData: ScheduleData) => Promise<boolean>;
  onRemoveSchedule: (scheduleId: string) => Promise<boolean>;
}

/**
 * 快速選擇面板元件
 * 用於快速排班操作
 */
const QuickSelectPanel: React.FC<QuickSelectPanelProps> = ({ date, schedules, onAddSchedule, onRemoveSchedule }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [globalLeaveType, setGlobalLeaveType] = useState<string | null>(null);
  
  // 班次類型
  const shifts: string[] = ['morning', 'afternoon', 'evening'];
  const shiftLabels: Record<string, string> = {
    morning: '早班',
    afternoon: '中班',
    evening: '晚班'
  };

  // 獲取員工列表函數
  const fetchEmployeesList = async (): Promise<{ employees: Employee[], error: string | null }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('一鍵排班錯誤: 未登入或權限不足，token不存在');
        throw new Error('未登入或權限不足');
      }

      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      console.log('開始獲取員工資料...');
      const response = await axios.get<any>('/api/employees', config);
      
      // 檢查響應格式
      if (!response || !response.data) {
        console.error('API響應格式錯誤: 響應或響應數據為空');
        throw new Error('API響應格式錯誤: 響應或響應數據為空');
      }
      
      console.log('API響應數據:', response.data);
      
      // 檢查employees字段是否存在
      if (!response.data.employees) {
        console.error('API響應格式錯誤: 缺少employees字段');
        
        // 嘗試從響應中找到可能的員工數據
        let employeesData: Employee[] = [];
        
        // 如果響應數據本身是數組，可能直接返回了員工列表
        if (Array.isArray(response.data)) {
          console.log('API直接返回了數組，嘗試使用它作為員工列表');
          employeesData = response.data;
        }
        // 如果響應中有data字段
        else if (response.data.data) {
          // 如果data是數組，可能是員工列表
          if (Array.isArray(response.data.data)) {
            console.log('在response.data.data中找到數組，嘗試使用它作為員工列表');
            employeesData = response.data.data;
          }
          // 如果data是對象，檢查是否有employees字段
          else if (response.data.data.employees && Array.isArray(response.data.data.employees)) {
            console.log('在response.data.data.employees中找到數組，嘗試使用它作為員工列表');
            employeesData = response.data.data.employees;
          }
          // 如果data對象中有totalCount和page等字段，可能是分頁數據，嘗試獲取employees字段
          else if (response.data.data.employees) {
            console.log('在response.data.data中找到employees字段，嘗試使用它作為員工列表');
            employeesData = response.data.data.employees;
          }
        }
        
        // 如果以上都不是，返回空數組
        if (employeesData.length === 0) {
          console.error('無法從API響應中找到員工數據');
          return { employees: [], error: 'API響應格式錯誤: 無法找到員工數據' };
        }
        
        console.log(`從API響應中提取到 ${employeesData.length} 名員工`);
        
        // 過濾掉主管，只保留一般員工
        const filteredEmployees = employeesData.filter((employee: Employee) => {
          if (!employee || !employee.department) {
            return true;
          }
          
          const department = employee.department.toLowerCase();
          const isManager = department.includes('主管') ||
                           department.includes('經理') ||
                           department.includes('supervisor') ||
                           department.includes('manager') ||
                           department.includes('director') ||
                           department.includes('長');
          
          return !isManager;
        });
        
        console.log(`過濾後剩餘 ${filteredEmployees.length} 名一般員工`);
        
        // 如果過濾後沒有員工，但原始資料有員工，則使用原始資料
        if (filteredEmployees.length === 0 && employeesData.length > 0) {
          console.warn('警告: 過濾後沒有一般員工，將使用所有員工資料');
          return { employees: employeesData, error: null };
        }
        
        return { employees: filteredEmployees, error: null };
      }
      
      console.log(`成功獲取員工資料，共 ${response.data.employees.length} 名員工`);
      
      // 過濾掉主管，只保留一般員工
      const filteredEmployees = response.data.employees.filter((employee: Employee) => {
        // 如果沒有部門資訊，預設為非主管
        if (!employee || !employee.department) {
          return true;
        }
        
        const department = employee.department.toLowerCase();
        const isManager = department.includes('主管') ||
                         department.includes('經理') ||
                         department.includes('supervisor') ||
                         department.includes('manager') ||
                         department.includes('director') ||
                         department.includes('長');
        
        return !isManager;
      });
      
      console.log(`過濾後剩餘 ${filteredEmployees.length} 名一般員工`);
      
      // 如果過濾後沒有員工，但原始資料有員工，則使用原始資料
      if (filteredEmployees.length === 0 && response.data.employees.length > 0) {
        console.warn('警告: 過濾後沒有一般員工，將使用所有員工資料');
        return { employees: response.data.employees, error: null };
      }
      
      return { employees: filteredEmployees, error: null };
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg ?? '獲取員工資料失敗';
      console.error('獲取員工資料失敗:', err);
      console.error('錯誤詳情:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      return { employees: [], error: errorMsg };
    }
  };

  // 檢查員工是否已被排班在指定班次
  const isEmployeeScheduled = (employeeId: string, shift: string, schedules: Schedules): boolean => {
    return (schedules[shift] ?? []).some(
      schedule => schedule.employee?._id === employeeId
    );
  };

  // 一鍵排班功能 - 自動將所有可用員工排入早班和午班
  const handleQuickScheduleAllEmployees = async (
    date: string,
    schedules: Schedules,
    employees: Employee[],
    addScheduleFunc: (scheduleData: ScheduleData) => Promise<boolean>,
    leaveType: string | null = null
  ): Promise<boolean> => {
    console.log(`一鍵排班開始檢查員工資料，共有 ${employees?.length || 0} 名員工`);
    
    if (!employees || employees.length === 0) {
      console.error('一鍵排班失敗: 沒有可用的員工資料');
      setError('一鍵排班失敗: 沒有可用的員工資料，請確認員工資料已正確載入');
      return false;
    }
    
    try {
      console.log('開始一鍵排班，日期:', date, '請假類型:', leaveType);
      console.log('可用員工列表:', employees.map(e => e.name).join(', '));
      
      // 解析日期並獲取月份資訊
      const { year, month } = parseDateString(date);
      console.log(`解析日期: ${date} -> 年=${year}, 月=${month + 1}`);
      
      // 為員工添加排班
      console.log('開始為員工添加排班...');
      const addedSchedules = await scheduleEmployeesForShifts(
        employees,
        schedules,
        date,
        addScheduleFunc,
        leaveType
      );
      
      // 重新獲取排班資料
      console.log('排班完成，重新獲取排班資料...');
      await refreshScheduleData(year, month);
      
      if (addedSchedules.length > 0) {
        console.log(`一鍵排班成功，共添加 ${addedSchedules.length} 個排班記錄`);
        setError(null); // 清除錯誤信息
        return true;
      } else {
        console.warn('一鍵排班完成，但沒有添加任何排班記錄');
        setError('一鍵排班完成，但沒有添加任何排班記錄，可能所有員工已經被排班');
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.message || '未知錯誤';
      console.error('一鍵排班失敗:', err);
      console.error('錯誤詳情:', {
        message: err.message,
        stack: err.stack,
        date: date,
        employeesCount: employees?.length || 0
      });
      setError(`一鍵排班失敗: ${errorMsg}`);
      return false;
    }
  };

  // 解析日期字符串
  const parseDateString = (dateStr: string): { year: number, month: number } => {
    const dateParts = dateStr.split('-');
    const year = parseInt(dateParts[0] || '0');
    const month = parseInt(dateParts[1] || '1') - 1; // 月份從0開始
    
    console.log(`日期解析: 年=${year}, 月=${month + 1}`);
    return { year, month };
  };

  // 為員工添加排班
  const scheduleEmployeesForShifts = async (
    employees: Employee[],
    schedules: Schedules,
    date: string,
    addScheduleFunc: (scheduleData: ScheduleData) => Promise<boolean>,
    leaveType: string | null
  ): Promise<Array<{ employee: string, shift: string }>> => {
    const morningShift = 'morning';
    const afternoonShift = 'afternoon';
    const addedSchedules: Array<{ employee: string, shift: string }> = [];
    const errors: Array<{ employee: string, shift: string, error: any }> = [];
    
    console.log(`開始為 ${employees.length} 名員工排班，日期: ${date}`);
    
    for (const employee of employees) {
      try {
        // 添加早班
        if (!isEmployeeScheduled(employee._id, morningShift, schedules)) {
          console.log(`嘗試為員工 ${employee.name} 添加早班...`);
          const success = await addShiftForEmployee(
            employee,
            date,
            morningShift,
            addScheduleFunc,
            leaveType
          );
          if (success) {
            console.log(`成功為員工 ${employee.name} 添加早班`);
            addedSchedules.push({ employee: employee.name, shift: morningShift });
          } else {
            console.warn(`無法為員工 ${employee.name} 添加早班`);
          }
        } else {
          console.log(`員工 ${employee.name} 已經被排入早班，跳過`);
        }
        
        // 添加午班
        if (!isEmployeeScheduled(employee._id, afternoonShift, schedules)) {
          console.log(`嘗試為員工 ${employee.name} 添加午班...`);
          const success = await addShiftForEmployee(
            employee,
            date,
            afternoonShift,
            addScheduleFunc,
            leaveType
          );
          if (success) {
            console.log(`成功為員工 ${employee.name} 添加午班`);
            addedSchedules.push({ employee: employee.name, shift: afternoonShift });
          } else {
            console.warn(`無法為員工 ${employee.name} 添加午班`);
          }
        } else {
          console.log(`員工 ${employee.name} 已經被排入午班，跳過`);
        }
      } catch (err: any) {
        console.error(`為員工 ${employee.name} 排班時發生錯誤:`, err);
        errors.push({
          employee: employee.name,
          shift: 'unknown',
          error: err.message || '未知錯誤'
        });
        // 繼續處理下一個員工，不中斷整個流程
      }
    }
    
    if (errors.length > 0) {
      console.error(`排班過程中發生 ${errors.length} 個錯誤:`, errors);
    }
    
    console.log(`一鍵排班完成，共添加 ${addedSchedules.length} 個排班記錄，發生 ${errors.length} 個錯誤`);
    return addedSchedules;
  };

  // 為單個員工添加單個班次
  const addShiftForEmployee = async (
    employee: Employee,
    date: string,
    shift: string,
    addScheduleFunc: (scheduleData: ScheduleData) => Promise<boolean>,
    leaveType: string | null
  ): Promise<boolean> => {
    try {
      const scheduleData: ScheduleData = {
        date,
        shift,
        employeeId: employee._id
      };
      
      const shiftName = shift === 'morning' ? '早班' : shift === 'afternoon' ? '午班' : '晚班';
      
      // 只有在 leaveType 不為 null 時才添加 leaveType 屬性
      if (leaveType) {
        scheduleData.leaveType = leaveType;
        console.log(`準備為員工 ${employee.name} 添加${shiftName}，請假類型: ${leaveType}`);
      } else {
        console.log(`準備為員工 ${employee.name} 添加${shiftName}，正常排班`);
      }
      
      console.log(`發送排班請求，數據:`, JSON.stringify(scheduleData));
      const result = await addScheduleFunc(scheduleData);
      
      if (result) {
        console.log(`成功為員工 ${employee.name} 添加${shiftName}`);
      } else {
        console.warn(`無法為員工 ${employee.name} 添加${shiftName}，API 返回失敗`);
      }
      
      return result;
    } catch (err: any) {
      console.error(`為員工 ${employee.name} 添加${shift === 'morning' ? '早班' : '午班'}時發生錯誤:`, err);
      console.error('錯誤詳情:', {
        employeeId: employee._id,
        employeeName: employee.name,
        date: date,
        shift: shift,
        leaveType: leaveType,
        message: err.message || '未知錯誤'
      });
      return false;
    }
  };

  // 重新獲取排班資料
  const refreshScheduleData = async (year: number, month: number): Promise<void> => {
    console.log('一鍵排班完成，重新獲取排班資料');
    
    // 獲取當前月份的完整日期範圍
    const monthStartDate = new Date(year, month, 1);
    const monthEndDate = new Date(year, month + 1, 0);
    
    const startDateStr = formatDateString(monthStartDate);
    const endDateStr = formatDateString(monthEndDate);
    
    console.log(`重新獲取排班資料: ${startDateStr} 至 ${endDateStr}`);
    
    // 等待一段時間，確保資料已經更新
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  // 格式化日期為 YYYY-MM-DD 格式
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 月份從0開始，所以要+1
    const day = date.getDate();
    
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return formattedDate;
  };

  // 格式化日期顯示
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      // 檢查日期是否有效
      if (isNaN(date.getTime())) {
        return dateString; // 如果無效，直接返回原始字串
      }
      
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch (error) {
      console.error('日期格式化錯誤:', error);
      return dateString; // 發生錯誤時返回原始字串
    }
  };

  // 獲取員工列表
  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      const result = await fetchEmployeesList();
      setEmployees(result.employees);
      setError(result.error);
      setLoading(false);
    };
    
    loadEmployees();
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', pb: 1 }}>
        <Typography variant="h6">
          {formatDate(date)} 快速排班
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="global-leave-type-label">請假類型</InputLabel>
            <Select
              labelId="global-leave-type-label"
              value={globalLeaveType ?? ''}
              onChange={(e: SelectChangeEvent<string>) => setGlobalLeaveType(e.target.value === '' ? null : e.target.value)}
              label="請假類型"
              size="small"
            >
              <MenuItem value="">
                <em>正常排班</em>
              </MenuItem>
              <MenuItem value="sick">病假 (獨立計算)</MenuItem>
              <MenuItem value="personal">特休 (獨立計算)</MenuItem>
              <MenuItem value="overtime">加班 (獨立計算)</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={async () => {
              console.log('點擊一鍵排班按鈕，日期:', date);
              const success = await handleQuickScheduleAllEmployees(date, schedules, employees, onAddSchedule, globalLeaveType);
              
              if (success) {
                // 通知父組件關閉快速排班面板
                // 這裡可以通過回調函數通知父組件
              }
            }}
          >
            一鍵排班
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 'calc(80vh - 150px)' }}>
          {shifts.map((shift) => (
            <ShiftSection
              key={shift}
              shift={shift}
              shiftLabel={shiftLabels[shift] || shift}
              employees={employees}
              schedules={schedules}
              date={date}
              onAddSchedule={onAddSchedule}
              onRemoveSchedule={onRemoveSchedule}
            />
          ))}
        </Box>
      )}
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          提示: 點擊員工名稱可切換該班次的排班狀態
        </Typography>
      </Box>
    </Paper>
  );
};

export default QuickSelectPanel;