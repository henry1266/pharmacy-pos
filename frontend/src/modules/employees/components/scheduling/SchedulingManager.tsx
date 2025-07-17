import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useEmployeeScheduling } from '../../core/hooks/useEmployeeScheduling';
import { useShiftTimeConfig } from '../../core/hooks/useShiftTimeConfig';
import useWorkHoursCalculation from '../../../../hooks/useWorkHoursCalculation';
import useScheduleCalculations from '../../../../hooks/useScheduleCalculations';
import ShiftTimeConfigManager from './ShiftTimeConfigManager';
import { formatDateString } from '../../../../utils/calendarUtils';

/**
 * 排班管理主組件
 * 整合班次時間配置、排班管理和工時計算功能
 */
const SchedulingManager: React.FC<{ onConfigUpdate?: () => void }> = ({ onConfigUpdate }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 排班相關 hooks
  const {
    schedulesGroupedByDate,
    loading: schedulesLoading,
    error: schedulesError,
    fetchSchedulesByDate
  } = useEmployeeScheduling();

  // 班次時間配置 hooks
  const {
    shiftTimesMap,
    loading: configLoading,
    error: configError,
    fetchConfigs
  } = useShiftTimeConfig();

  // 工時計算 hooks
  const { calculateEmployeeMonthlyHours } = useWorkHoursCalculation(schedulesGroupedByDate);
  const { calculateShiftHours } = useScheduleCalculations(schedulesGroupedByDate);

  // 初始化數據
  useEffect(() => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startDate = formatDateString(firstDayOfMonth);
    const endDate = formatDateString(lastDayOfMonth);
    
    fetchSchedulesByDate(startDate, endDate);
    fetchConfigs();
  }, [currentDate, fetchSchedulesByDate, fetchConfigs]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleConfigUpdate = () => {
    // 當班次時間配置更新後，重新獲取排班數據以重新計算工時
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startDate = formatDateString(firstDayOfMonth);
    const endDate = formatDateString(lastDayOfMonth);
    
    fetchSchedulesByDate(startDate, endDate);
    
    // 調用外部回調
    if (onConfigUpdate) {
      onConfigUpdate();
    }
  };

  // 渲染班次時間配置標籤頁
  const renderShiftTimeConfig = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        班次時間配置
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        設定早班、中班、晚班的起迄時間，系統將自動計算工時並應用到所有排班計算中。
      </Typography>
      
      <ShiftTimeConfigManager onConfigUpdate={handleConfigUpdate} />
    </Box>
  );

  // 渲染排班管理標籤頁
  const renderScheduleManagement = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        排班管理
      </Typography>
      
      {/* 顯示當前班次時間配置 */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          當前班次時間配置：
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(shiftTimesMap).map(([shift, config]) => (
            <Grid item xs={4} key={shift}>
              <Typography variant="body2">
                <strong>
                  {shift === 'morning' ? '早班' : 
                   shift === 'afternoon' ? '中班' : '晚班'}:
                </strong>{' '}
                {config.start} - {config.end}
                ({calculateShiftHours(shift as 'morning' | 'afternoon' | 'evening').toFixed(1)}小時)
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Alert severity="info" sx={{ mb: 2 }}>
        排班功能開發中，將整合動態班次時間配置
      </Alert>
    </Box>
  );

  // 渲染工時統計標籤頁
  const renderHoursReport = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        工時統計報告
      </Typography>
      
      {/* 員工工時統計 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          員工月度工時統計
        </Typography>
        
        {calculateEmployeeMonthlyHours.length > 0 ? (
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={3}>
              <Typography variant="body2" fontWeight="bold">員工姓名</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2" fontWeight="bold">正常工時</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2" fontWeight="bold">加班工時</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2" fontWeight="bold">特休工時</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2" fontWeight="bold">病假工時</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            {calculateEmployeeMonthlyHours.map((employee) => (
              <React.Fragment key={employee.employeeId}>
                <Grid item xs={3}>
                  <Typography variant="body2">{employee.name}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="body2">{employee.hours}h</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="body2">{employee.overtimeHours}h</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="body2">{employee.personalLeaveHours}h</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="body2">{employee.sickLeaveHours}h</Typography>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            暫無工時數據
          </Typography>
        )}
      </Paper>
    </Box>
  );

  if (schedulesLoading || configLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab 
              icon={<SettingsIcon />} 
              label="班次時間配置" 
              iconPosition="start"
            />
            <Tab 
              icon={<ScheduleIcon />} 
              label="排班管理" 
              iconPosition="start"
            />
            <Tab 
              icon={<AssessmentIcon />} 
              label="工時統計" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* 錯誤提示 */}
        {(schedulesError || configError) && (
          <Alert severity="error" sx={{ m: 2 }}>
            {schedulesError || configError}
          </Alert>
        )}

        {/* 標籤頁內容 */}
        {currentTab === 0 && renderShiftTimeConfig()}
        {currentTab === 1 && renderScheduleManagement()}
        {currentTab === 2 && renderHoursReport()}
      </Paper>
    </Box>
  );
};

export default SchedulingManager;