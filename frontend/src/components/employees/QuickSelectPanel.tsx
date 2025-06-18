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
  Schedule,
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
        throw new Error('未登入或權限不足');
      }

      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      const response = await axios.get<EmployeesApiResponse>('/api/employees', config);
      // 過濾掉主管，只保留一般員工
      const filteredEmployees = response.data.employees.filter((employee: Employee) => {
        const department = employee.department.toLowerCase();
        return !department.includes('主管') &&
               !department.includes('經理') &&
               !department.includes('supervisor') &&
               !department.includes('manager') &&
               !department.includes('director') &&
               !department.includes('長');
      });
      
      return { employees: filteredEmployees, error: null };
    } catch (err: any) {
      console.error('獲取員工資料失敗:', err);
      return { employees: [], error: err.response?.data?.msg || '獲取員工資料失敗' };
    }
  };

  // 檢查員工是否已被排班在指定班次
  const isEmployeeScheduled = (employeeId: string, shift: string, schedules: Schedules): boolean => {
    return (schedules[shift] || []).some(
      schedule => schedule.employee._id === employeeId
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
    if (!employees || employees.length === 0) return false;
    
    try {
      console.log('開始一鍵排班，日期:', date, '請假類型:', leaveType);
      
      // 解析日期並獲取月份資訊
      const { year, month } = parseDateString(date);
      
      // 為員工添加排班
      const addedSchedules = await scheduleEmployeesForShifts(
        employees,
        schedules,
        date,
        addScheduleFunc,
        leaveType
      );
      
      // 重新獲取排班資料
      await refreshScheduleData(year, month);
      
      return addedSchedules.length > 0;
    } catch (err) {
      console.error('一鍵排班失敗:', err);
      return false;
    }
  };

  // 解析日期字符串
  const parseDateString = (dateStr: string): { year: number, month: number } => {
    const dateParts = dateStr.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // 月份從0開始
    
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
    
    for (const employee of employees) {
      // 添加早班
      if (!isEmployeeScheduled(employee._id, morningShift, schedules)) {
        const success = await addShiftForEmployee(
          employee,
          date,
          morningShift,
          addScheduleFunc,
          leaveType
        );
        if (success) {
          addedSchedules.push({ employee: employee.name, shift: morningShift });
        }
      }
      
      // 添加午班
      if (!isEmployeeScheduled(employee._id, afternoonShift, schedules)) {
        const success = await addShiftForEmployee(
          employee,
          date,
          afternoonShift,
          addScheduleFunc,
          leaveType
        );
        if (success) {
          addedSchedules.push({ employee: employee.name, shift: afternoonShift });
        }
      }
    }
    
    console.log(`一鍵排班完成，共添加 ${addedSchedules.length} 個排班記錄`);
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
    const scheduleData: ScheduleData = {
      date,
      shift,
      employeeId: employee._id
    };
    
    // 只有在 leaveType 不為 null 時才添加 leaveType 屬性
    if (leaveType) {
      scheduleData.leaveType = leaveType;
      console.log(`為員工 ${employee.name} 添加${shift === 'morning' ? '早班' : '午班'}，請假類型: ${leaveType}`);
    } else {
      console.log(`為員工 ${employee.name} 添加${shift === 'morning' ? '早班' : '午班'}，正常排班`);
    }
    
    return await addScheduleFunc(scheduleData);
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
          <FormControl size="small" sx={{ minWidth: 120 }} {...({} as any)}>
            <InputLabel id="global-leave-type-label">請假類型</InputLabel>
            <Select
              labelId="global-leave-type-label"
              value={globalLeaveType || ''}
              onChange={(e: SelectChangeEvent<string>) => setGlobalLeaveType(e.target.value || null)}
              label="請假類型"
              size="small"
              {...({} as any)}
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
              shiftLabel={shiftLabels[shift]}
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