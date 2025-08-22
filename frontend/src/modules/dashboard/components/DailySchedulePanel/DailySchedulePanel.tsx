import React, { FC, memo, Suspense, lazy, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Skeleton
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import ShiftHeader from './ShiftHeader';
import ShiftContent from './ShiftContent';
import EmptyStateMessage from './EmptyStateMessage';
import ErrorBoundary from './ErrorBoundary';
import { useDailyScheduleSummary } from '../../hooks/useDailyScheduleSummary';
import { formatDate } from '../../utils/scheduleUtils';

// 懶加載加班對話框
const TimeCalculationOvertimeDialog = lazy(() =>
  import('../../../employees/components/overtime/TimeCalculationOvertimeDialog')
);

export interface DailySchedulePanelProps {
  selectedDate: string;
}

/**
 * 當日班表面板
 * 顯示當日的排班和加班信息
 */
const DailySchedulePanel: FC<DailySchedulePanelProps> = ({ selectedDate }) => {
  const {
    // 數據
    shiftData,
    employees,
    totalEmployees,
    
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
  } = useDailyScheduleSummary(selectedDate);
  
  // 加班對話框狀態
  const [overtimeDialogOpen, setOvertimeDialogOpen] = React.useState<boolean>(false);
  
  // 打卡按鈕點擊處理
  const handleOvertimeButtonClick = useCallback(() => {
    handleOvertimeClockIn();
    setOvertimeDialogOpen(true);
  }, [handleOvertimeClockIn]);
  
  // 關閉加班對話框
  const handleCloseDialog = useCallback(() => {
    handleCloseOvertimeDialog();
    setOvertimeDialogOpen(false);
  }, [handleCloseOvertimeDialog]);
  
  // 載入中的骨架屏
  const renderSkeleton = () => (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
          <Skeleton variant="text" width={120} height={32} />
        </Box>
        <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />
        
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} variant="circular" width={40} height={40} />
              ))}
            </Box>
            {i < 3 && <Skeleton variant="text" width="100%" height={1} sx={{ my: 1 }} />}
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  // 如果正在載入，顯示骨架屏
  if (loading) {
    return renderSkeleton();
  }

  // 如果有錯誤，顯示錯誤信息
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

  // 正常渲染
  return (
    <ErrorBoundary>
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
              <ShiftHeader 
                shift={shift} 
                onOvertimeClockIn={shift.shift === 'overtime' ? handleOvertimeButtonClick : undefined} 
              />
              
              {/* 班次內容 */}
              <ShiftContent 
                shift={shift} 
                getEmployeeInfo={getEmployeeInfo} 
              />
              
              {index < shiftData.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </Box>

        {/* 無排班提示 */}
        {totalEmployees === 0 && (
          <EmptyStateMessage 
            message="當日無排班記錄"
          />
        )}

        {/* 時間計算加班對話框 - 使用 Suspense 懶加載 */}
        <Suspense fallback={<CircularProgress size={24} />}>
          {overtimeDialogOpen && (
            <TimeCalculationOvertimeDialog
              open={overtimeDialogOpen}
              onClose={handleCloseDialog}
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
          )}
        </Suspense>
      </CardContent>
    </Card>
    </ErrorBoundary>
  );
};

export { DailySchedulePanel };
export default memo(DailySchedulePanel);