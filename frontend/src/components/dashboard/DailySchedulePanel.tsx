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
  AvatarGroup
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// Import hooks and services
import { useEmployeeScheduling } from '../../modules/employees/core/hooks/useEmployeeScheduling';
import { employeeService } from '../../modules/employees/core/employeeService';

// Import types
import type { EmployeeSchedule } from '../../modules/employees/types';
import type { Employee } from '@pharmacy-pos/shared/types/entities';

interface DailySchedulePanelProps {
  selectedDate: string;
}

interface ShiftSchedule {
  shift: 'morning' | 'afternoon' | 'evening';
  shiftName: string;
  timeRange: string;
  employees: EmployeeSchedule[];
  color: string;
}

const DailySchedulePanel: FC<DailySchedulePanelProps> = ({ selectedDate }) => {
  const { schedulesGroupedByDate, loading, error, fetchSchedulesByDate } = useEmployeeScheduling();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 預設班次配置（如果資料庫沒有時間資料時使用）
  const defaultShiftConfig: Record<string, { name: string; time: string; color: string }> = {
    morning: { name: '早班', time: '08:00-16:00', color: '#4CAF50' },
    afternoon: { name: '中班', time: '16:00-24:00', color: '#FF9800' },
    evening: { name: '晚班', time: '00:00-08:00', color: '#3F51B5' }
  };

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

  // 手動重新整理功能
  const handleRefresh = useCallback(() => {
    loadScheduleData();
    loadEmployees();
  }, [loadScheduleData, loadEmployees]);

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

  // 獲取實際班次時間範圍
  const getShiftTimeRange = useCallback((shift: 'morning' | 'afternoon' | 'evening', employees: EmployeeSchedule[]): string => {
    // 如果有員工資料且包含時間資訊，使用實際時間
    if (employees.length > 0 && employees[0].startTime && employees[0].endTime) {
      return `${employees[0].startTime}-${employees[0].endTime}`;
    }
    // 否則使用預設時間
    return defaultShiftConfig[shift].time;
  }, []);

  // 準備班次數據
  const shiftData: ShiftSchedule[] = React.useMemo(() => {
    const daySchedules = schedulesGroupedByDate[selectedDate];

    return Object.entries(defaultShiftConfig).map(([shift, config]) => {
      const shiftEmployees = daySchedules ? (daySchedules[shift as keyof typeof daySchedules] || []) : [];
      
      return {
        shift: shift as 'morning' | 'afternoon' | 'evening',
        shiftName: config.name,
        timeRange: getShiftTimeRange(shift as 'morning' | 'afternoon' | 'evening', shiftEmployees),
        employees: shiftEmployees,
        color: config.color
      };
    });
  }, [schedulesGroupedByDate, selectedDate, getShiftTimeRange]);

  const totalEmployees = React.useMemo(() => 
    shiftData.reduce((sum, shift) => sum + shift.employees.length, 0), 
    [shiftData]
  );
  
  const totalLeaves = React.useMemo(() => 
    shiftData.reduce((sum, shift) => 
      sum + shift.employees.filter(emp => emp.leaveType).length, 0
    ), 
    [shiftData]
  );

  if (loading || employeesLoading) {
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
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={shift.timeRange}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {shift.employees.length} 人
                </Typography>
              </Box>

              {/* 員工頭像並排顯示 */}
              <Box sx={{ pl: 1, pr: 1, pb: 1 }}>
                {shift.employees.length === 0 ? (
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
                            {getEmployeePhone(employee.employeeId) && (
                              <Typography variant="caption" color="inherit" sx={{ display: 'block' }}>
                                電話: {getEmployeePhone(employee.employeeId)}
                              </Typography>
                            )}
                            {employee.startTime && employee.endTime && (
                              <Typography variant="caption" color="inherit" sx={{ display: 'block' }}>
                                時間: {employee.startTime} - {employee.endTime}
                              </Typography>
                            )}
                            {employee.leaveType && (
                              <Typography variant="caption" color="inherit" sx={{ display: 'block' }}>
                                狀態: {getLeaveTypeLabel(employee.leaveType)}
                              </Typography>
                            )}
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
                              bgcolor: shift.color,
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
      </CardContent>
    </Card>
  );
};

export default DailySchedulePanel;