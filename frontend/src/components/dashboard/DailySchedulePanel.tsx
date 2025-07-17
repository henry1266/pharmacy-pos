import React, { FC, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  Button,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// Import hooks and services
import { useEmployeeScheduling } from '../../modules/employees/core/hooks/useEmployeeScheduling';
import { useShiftTimeConfig } from '../../modules/employees/core/hooks/useShiftTimeConfig';
import { useOvertimeManager } from '../../modules/employees/core/hooks/useOvertimeManager';
import { employeeService } from '../../modules/employees/core/employeeService';

// Import overtime components
import TimeCalculationOvertimeDialog from '../../modules/employees/components/overtime/TimeCalculationOvertimeDialog';

// Import types
import type { EmployeeSchedule, ShiftTimesMap, OvertimeRecord } from '../../modules/employees/types';
import type { Employee } from '@pharmacy-pos/shared/types/entities';
import { OvertimeStatus } from '@pharmacy-pos/shared/utils/overtimeDataProcessor';

interface DailySchedulePanelProps {
  selectedDate: string;
}

interface ShiftSchedule {
  shift: 'morning' | 'afternoon' | 'evening' | 'overtime';
  shiftName: string;
  timeRange: string;
  employees: EmployeeSchedule[];
  overtimeRecords?: any[];
  color: string;
}

const DailySchedulePanel: FC<DailySchedulePanelProps> = ({ selectedDate }) => {
  const { schedulesGroupedByDate, loading, error, fetchSchedulesByDate } = useEmployeeScheduling();
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
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 打卡按鈕相關狀態
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [overtimeFormData, setOvertimeFormData] = useState({
    employeeId: '',
    date: selectedDate,
    hours: '',
    description: '',
    status: 'pending' as OvertimeStatus,
    currentTime: ''
  });
  const [overtimeFormErrors, setOvertimeFormErrors] = useState<Record<string, string>>({});

  // 班次基本配置（包含名稱、顏色和時段區間）
  const shiftBaseConfig: Record<string, { name: string; color: string; timeRange: string }> = React.useMemo(() => ({
    morning: {
      name: '早班',
      color: '#4CAF50',
      timeRange: shiftTimesMap.morning ? `${shiftTimesMap.morning.start} - ${shiftTimesMap.morning.end}` : '08:30 - 12:00'
    },
    afternoon: {
      name: '中班',
      color: '#FF9800',
      timeRange: shiftTimesMap.afternoon ? `${shiftTimesMap.afternoon.start} - ${shiftTimesMap.afternoon.end}` : '15:00 - 18:00'
    },
    evening: {
      name: '晚班',
      color: '#3F51B5',
      timeRange: shiftTimesMap.evening ? `${shiftTimesMap.evening.start} - ${shiftTimesMap.evening.end}` : '19:00 - 20:30'
    },
    overtime: {
      name: '加班',
      color: '#E91E63',
      timeRange: '' // 將由按鈕替代
    }
  }), [shiftTimesMap]);

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

  const loadScheduleData = useCallback(async () => {
    if (!selectedDate) return;
    
    setDebugInfo(`正在載入 ${selectedDate} 的排班資料...`);
    
    try {
      await fetchSchedulesByDate(selectedDate, selectedDate);
      setDebugInfo(`API 調用成功，正在處理排班資料...`);
    } catch (err) {
      setDebugInfo(`API 調用失敗: ${err}`);
    }
  }, [selectedDate, fetchSchedulesByDate]);

  useEffect(() => {
    if (selectedDate) {
      loadScheduleData();
      loadEmployees();
    }
  }, [selectedDate, loadScheduleData, loadEmployees]);

  // 同步 useOvertimeManager 的月份設置
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

  // 手動重新整理功能
  const handleRefresh = useCallback(() => {
    loadScheduleData();
    loadEmployees();
    fetchOvertimeRecords();
  }, [loadScheduleData, loadEmployees, fetchOvertimeRecords]);

  // 打卡按鈕點擊處理
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
    setOvertimeDialogOpen(true);
  }, [selectedDate]);

  // 關閉加班對話框
  const handleCloseOvertimeDialog = useCallback(() => {
    setOvertimeDialogOpen(false);
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

  // 處理表單輸入變更
  const handleOvertimeInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
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

  // 提交加班記錄
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

  // 測試 API 連接
  const testApiConnection = useCallback(async () => {
    setDebugInfo('正在測試 API 連接...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setDebugInfo('錯誤: 未找到認證 token');
        return;
      }

      const testDate = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/employee-schedules/by-date?startDate=${testDate}&endDate=${testDate}`, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setDebugInfo(`API 測試結果:\n狀態: ${response.status}\n回應: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setDebugInfo(`API 測試失敗: ${error}`);
    }
  }, []);

  const getEmployeeName = useCallback((employeeId: string): string => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? employee.name : `員工ID: ${employeeId}`;
  }, [employees]);

  const getEmployeePosition = useCallback((employeeId: string): string => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? employee.position : '未知職位';
  }, [employees]);

  const getEmployeePhone = useCallback((employeeId: string): string => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? employee.phone : '';
  }, [employees]);

  const formatDate = useCallback((dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'MM月dd日 (EEEE)', { locale: zhTW });
    } catch {
      return dateStr;
    }
  }, []);

  const getLeaveTypeLabel = useCallback((leaveType: string | null): string => {
    const leaveTypeMap: Record<string, string> = {
      sick: '病假',
      personal: '事假',
      overtime: '加班'
    };
    return leaveType ? leaveTypeMap[leaveType] || leaveType : '';
  }, []);

  const getLeaveTypeColor = useCallback((leaveType: string | null): 'default' | 'warning' | 'error' | 'info' => {
    const colorMap: Record<string, 'default' | 'warning' | 'error' | 'info'> = {
      sick: 'error',
      personal: 'warning',
      overtime: 'info'
    };
    return leaveType ? colorMap[leaveType] || 'default' : 'default';
  }, []);

  /**
   * 為員工生成固定的頭像顏色
   * 基於員工ID生成一致的顏色
   */
  const getEmployeeAvatarColor = useCallback((employeeId: string): string => {
    const colors = [
      '#1976d2', // 藍色
      '#388e3c', // 綠色
      '#f57c00', // 橙色
      '#7b1fa2', // 紫色
      '#d32f2f', // 紅色
      '#0288d1', // 淺藍色
      '#689f38', // 淺綠色
      '#f9a825', // 黃色
      '#5d4037', // 棕色
      '#455a64', // 藍灰色
      '#e91e63', // 粉紅色
      '#00796b'  // 青色
    ];
    
    // 使用員工ID的字符碼總和來選擇顏色
    let hash = 0;
    for (let i = 0; i < employeeId.length; i++) {
      hash += employeeId.charCodeAt(i);
    }
    
    return colors[hash % colors.length];
  }, []);

  /**
   * 獲取當日的加班記錄
   */
  const getDailyOvertimeRecords = useCallback(() => {
    if (!overtimeRecords || !selectedDate) {
      console.log('getDailyOvertimeRecords: 缺少必要數據', {
        overtimeRecordsLength: overtimeRecords?.length || 0,
        selectedDate
      });
      return [];
    }
    
    console.log('getDailyOvertimeRecords: 開始篩選', {
      totalRecords: overtimeRecords.length,
      selectedDate,
      allRecords: overtimeRecords.map(r => ({
        id: r._id,
        date: r.date,
        formattedDate: new Date(r.date).toISOString().split('T')[0]
      }))
    });
    
    const filteredRecords = overtimeRecords.filter(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      const matches = recordDate === selectedDate;
      
      if (matches) {
        console.log('找到匹配的加班記錄:', {
          recordId: record._id,
          recordDate,
          selectedDate,
          employeeId: record.employeeId,
          hours: record.hours
        });
      }
      
      return matches;
    });
    
    console.log('getDailyOvertimeRecords: 篩選結果', {
      filteredCount: filteredRecords.length,
      records: filteredRecords
    });
    
    return filteredRecords;
  }, [overtimeRecords, selectedDate]);

  // 準備班次數據
  const shiftData: ShiftSchedule[] = React.useMemo(() => {
    const daySchedules = schedulesGroupedByDate[selectedDate];
    const dailyOvertimeRecords = getDailyOvertimeRecords();

    return Object.keys(shiftBaseConfig).map((shift) => {
      const baseConfig = shiftBaseConfig[shift];
      
      if (shift === 'overtime') {
        // 加班項目
        return {
          shift: shift as 'overtime',
          shiftName: baseConfig.name,
          timeRange: baseConfig.timeRange,
          employees: [],
          overtimeRecords: dailyOvertimeRecords,
          color: baseConfig.color
        };
      } else {
        // 正常班次
        const shiftEmployees = daySchedules ? (daySchedules[shift as keyof typeof daySchedules] || []) : [];
        
        return {
          shift: shift as 'morning' | 'afternoon' | 'evening',
          shiftName: baseConfig.name,
          timeRange: baseConfig.timeRange,
          employees: shiftEmployees,
          color: baseConfig.color
        };
      }
    });
  }, [schedulesGroupedByDate, selectedDate, shiftBaseConfig, getDailyOvertimeRecords]);

  const totalEmployees = React.useMemo(() =>
    shiftData.reduce((sum, shift) => {
      if (shift.shift === 'overtime') {
        return sum + (shift.overtimeRecords?.length || 0);
      }
      return sum + shift.employees.length;
    }, 0),
    [shiftData]
  );
  
  const totalLeaves = React.useMemo(() =>
    shiftData.reduce((sum, shift) => {
      if (shift.shift === 'overtime') {
        return sum;
      }
      return sum + shift.employees.filter(emp => emp.leaveType).length;
    }, 0),
    [shiftData]
  );

  if (loading || employeesLoading || shiftConfigLoading || overtimeLoading) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScheduleIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" color="primary.main">
              當日班表
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScheduleIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" color="primary.main">
              當日班表
            </Typography>
          </Box>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        {/* 標題區域 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" color="primary.main">
              當日班表
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{ minWidth: 'auto' }}
            >
              重新整理
            </Button>
          </Box>
        </Box>

        {/* 日期顯示 */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatDate(selectedDate)}
        </Typography>

        {/* 班次列表 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {shiftData.map((shift, index) => (
            <Box key={shift.shift}>
              {/* 班次標題 */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: shift.color
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight="medium">
                    {shift.shiftName}
                  </Typography>
                  {shift.shift === 'overtime' ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<AccessTimeIcon />}
                      onClick={handleOvertimeClockIn}
                      sx={{
                        ml: 1,
                        minWidth: 'auto',
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 1
                      }}
                    >
                      打卡
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {shift.timeRange}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {shift.shift === 'overtime'
                    ? `${shift.overtimeRecords?.length || 0} 筆`
                    : `${shift.employees.length} 人`
                  }
                </Typography>
              </Box>

              {/* 員工頭像並排顯示或加班記錄顯示 */}
              <Box sx={{ pl: 1, pr: 1, pb: 1 }}>
                {shift.shift === 'overtime' ? (
                  /* 加班記錄顯示 */
                  shift.overtimeRecords && shift.overtimeRecords.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      {shift.overtimeRecords.map((overtimeRecord) => {
                        const employeeId = typeof overtimeRecord.employeeId === 'object' && overtimeRecord.employeeId && '_id' in overtimeRecord.employeeId
                          ? (overtimeRecord.employeeId as any)._id
                          : (overtimeRecord.employeeId as string) || '';
                        const employeeName = typeof overtimeRecord.employeeId === 'object' && overtimeRecord.employeeId && 'name' in overtimeRecord.employeeId
                          ? (overtimeRecord.employeeId as any).name
                          : getEmployeeName(employeeId);
                        
                        return (
                          <Tooltip
                            key={overtimeRecord._id}
                            title={
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {employeeName}
                                </Typography>
                                <Typography variant="caption" color="inherit">
                                  加班時數: {(overtimeRecord.hours * 60)} 分鐘
                                </Typography>
                                {overtimeRecord.description && (
                                  <Typography variant="caption" color="inherit" display="block">
                                    說明: {overtimeRecord.description}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="inherit" display="block">
                                  狀態: {overtimeRecord.status === 'approved' ? '已核准' :
                                        overtimeRecord.status === 'pending' ? '待審核' : '已拒絕'}
                                </Typography>
                              </Box>
                            }
                            placement="top"
                            arrow
                          >
                            <Box sx={{ position: 'relative' }}>
                              <Avatar
                                sx={{
                                  width: 40,
                                  height: 40,
                                  fontSize: '0.875rem',
                                  bgcolor: getEmployeeAvatarColor(employeeId),
                                  cursor: 'pointer',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    transition: 'transform 0.2s ease-in-out'
                                  }
                                }}
                              >
                                {employeeName.charAt(0)}
                              </Avatar>
                              <Chip
                                label={`${overtimeRecord.hours * 60}m`}
                                size="small"
                                color={overtimeRecord.status === 'approved' ? 'success' :
                                       overtimeRecord.status === 'pending' ? 'warning' : 'error'}
                                sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  fontSize: '0.6rem',
                                  height: 16,
                                  '& .MuiChip-label': {
                                    px: 0.5
                                  }
                                }}
                              />
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      當日無加班記錄
                    </Typography>
                  )
                ) : (
                  /* 正常班次員工顯示 */
                  shift.employees.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      此班次無排班
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      {shift.employees.map((employee) => (
                        <Tooltip
                          key={employee._id}
                          title={
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {getEmployeeName(employee.employeeId)}
                              </Typography>
                              <Typography variant="caption" color="inherit">
                                職位: {getEmployeePosition(employee.employeeId)}
                              </Typography>
                            </Box>
                          }
                          placement="top"
                          arrow
                        >
                          <Box sx={{ position: 'relative' }}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                fontSize: '0.875rem',
                                bgcolor: getEmployeeAvatarColor(employee.employeeId),
                                cursor: 'pointer',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  transition: 'transform 0.2s ease-in-out'
                                }
                              }}
                            >
                              {getEmployeeName(employee.employeeId).charAt(0)}
                            </Avatar>
                            {employee.leaveType && (
                              <Chip
                                label={getLeaveTypeLabel(employee.leaveType)}
                                size="small"
                                color={getLeaveTypeColor(employee.leaveType)}
                                sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  fontSize: '0.6rem',
                                  height: 16,
                                  '& .MuiChip-label': {
                                    px: 0.5
                                  }
                                }}
                              />
                            )}
                          </Box>
                        </Tooltip>
                      ))}
                    </Box>
                  )
                )}
              </Box>

              {index < shiftData.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </Box>

        {/* 無排班提示 */}
        {totalEmployees === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              當日無排班記錄
            </Typography>
            <Typography variant="caption" color="text.secondary">
              請使用「測試 API」按鈕檢查後端連接狀態
            </Typography>
          </Box>
        )}

        {/* 時間計算加班對話框 */}
        <TimeCalculationOvertimeDialog
          open={overtimeDialogOpen}
          onClose={handleCloseOvertimeDialog}
          title="加班打卡"
          formData={overtimeFormData}
          formErrors={overtimeFormErrors}
          employees={employees}
          employeeId={null}
          isAdmin={true}
          submitting={submitting}
          onInputChange={handleOvertimeInputChange}
          onSubmit={handleSubmitOvertimeRecord}
          submitButtonText="確認打卡"
        />
      </CardContent>
    </Card>
  );
};

export { DailySchedulePanel };
export default DailySchedulePanel;