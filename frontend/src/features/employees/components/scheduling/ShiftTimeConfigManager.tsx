/**
 * 班次時間配置管理組件
 * 提供班次時間的查看、編輯和管理功能
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useShiftTimeConfig } from '../../core/hooks/useShiftTimeConfig';
import type { ShiftTimeConfigData, ShiftTimeConfigUpdateData } from '../../types';

/**
 * 班次配置項目介面
 */
interface ShiftConfigItem {
  shift: 'morning' | 'afternoon' | 'evening';
  label: string;
  color: 'primary' | 'secondary' | 'success';
}

/**
 * 班次時間配置管理組件
 */
const ShiftTimeConfigManager: React.FC<{ onConfigUpdate?: () => void }> = ({ onConfigUpdate }) => {
  const {
    configs,
    shiftTimesMap,
    loading,
    error,
    fetchConfigs,
    createOrUpdateConfig,
    updateConfig,
    validateTimeFormat,
    validateTimeRange
  } = useShiftTimeConfig();

  const [editingShift, setEditingShift] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    startTime: '',
    endTime: '',
    description: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    shift: '',
    action: ''
  });

  // 班次配置項目
  const shiftItems: ShiftConfigItem[] = [
    { shift: 'morning', label: '早班', color: 'primary' },
    { shift: 'afternoon', label: '中班', color: 'secondary' },
    { shift: 'evening', label: '晚班', color: 'success' }
  ];

  /**
   * 開始編輯班次時間
   */
  const handleStartEdit = (shift: 'morning' | 'afternoon' | 'evening') => {
    const currentConfig = configs.find(c => c.shift === shift);
    const currentTimes = shiftTimesMap[shift];
    
    setEditingShift(shift);
    setEditForm({
      startTime: currentConfig?.startTime || currentTimes.start,
      endTime: currentConfig?.endTime || currentTimes.end,
      description: currentConfig?.description || ''
    });
    setValidationErrors({});
  };

  /**
   * 取消編輯
   */
  const handleCancelEdit = () => {
    setEditingShift(null);
    setEditForm({ startTime: '', endTime: '', description: '' });
    setValidationErrors({});
  };

  /**
   * 驗證表單
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!validateTimeFormat(editForm.startTime)) {
      errors.startTime = '開始時間格式無效 (請使用 HH:MM 格式)';
    }

    if (!validateTimeFormat(editForm.endTime)) {
      errors.endTime = '結束時間格式無效 (請使用 HH:MM 格式)';
    }

    if (editForm.startTime && editForm.endTime && !validateTimeRange(editForm.startTime, editForm.endTime)) {
      errors.timeRange = '開始時間必須早於結束時間';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * 保存班次時間配置
   */
  const handleSave = async () => {
    if (!editingShift || !validateForm()) {
      return;
    }

    try {
      const existingConfig = configs.find(c => c.shift === editingShift);
      
      if (existingConfig) {
        // 更新現有配置
        const updateData: ShiftTimeConfigUpdateData = {
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          description: editForm.description
        };
        await updateConfig(editingShift as 'morning' | 'afternoon' | 'evening', updateData);
      } else {
        // 創建新配置
        const configData: ShiftTimeConfigData = {
          shift: editingShift as 'morning' | 'afternoon' | 'evening',
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          description: editForm.description
        };
        await createOrUpdateConfig(configData);
      }

      setSnackbar({
        open: true,
        message: '班次時間配置保存成功',
        severity: 'success'
      });
      
      handleCancelEdit();
      
      // 調用外部回調
      if (onConfigUpdate) {
        onConfigUpdate();
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || '保存失敗',
        severity: 'error'
      });
    }
  };

  /**
   * 刷新配置
   */
  const handleRefresh = async () => {
    try {
      await fetchConfigs();
      setSnackbar({
        open: true,
        message: '配置已刷新',
        severity: 'success'
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: '刷新失敗',
        severity: 'error'
      });
    }
  };

  /**
   * 關閉提示訊息
   */
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  /**
   * 計算班次工時
   */
  const calculateHours = (startTime: string, endTime: string): string => {
    if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
      return '--';
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTimeInMinutes = (startHour || 0) * 60 + (startMinute || 0);
    const endTimeInMinutes = (endHour || 0) * 60 + (endMinute || 0);
    
    const hours = (endTimeInMinutes - startTimeInMinutes) / 60;
    return hours > 0 ? `${hours.toFixed(1)} 小時` : '--';
  };

  return (
    <Box>
      {/* 標題和操作按鈕 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <ScheduleIcon color="primary" />
          <Typography variant="h6">班次時間配置管理</Typography>
        </Box>
        <Tooltip title="刷新配置">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 班次配置卡片 */}
      <Grid container spacing={3}>
        {shiftItems.map((item) => {
          const currentTimes = shiftTimesMap[item.shift];
          const isEditing = editingShift === item.shift;
          const config = configs.find(c => c.shift === item.shift);

          return (
            <Grid item xs={12} md={4} key={item.shift}>
              <Card>
                <CardContent>
                  {/* 班次標題 */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip 
                        label={item.label} 
                        color={item.color} 
                        size="small" 
                      />
                      {config && (
                        <Chip 
                          label="已配置" 
                          variant="outlined" 
                          size="small" 
                        />
                      )}
                    </Box>
                    {!isEditing && (
                      <IconButton 
                        size="small" 
                        onClick={() => handleStartEdit(item.shift)}
                        disabled={loading}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {isEditing ? (
                    /* 編輯模式 */
                    <Box>
                      <TextField
                        label="開始時間"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                        placeholder="HH:MM"
                        size="small"
                        fullWidth
                        margin="dense"
                        error={!!validationErrors.startTime}
                        helperText={validationErrors.startTime}
                      />
                      <TextField
                        label="結束時間"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                        placeholder="HH:MM"
                        size="small"
                        fullWidth
                        margin="dense"
                        error={!!validationErrors.endTime}
                        helperText={validationErrors.endTime}
                      />
                      <TextField
                        label="描述"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        size="small"
                        fullWidth
                        margin="dense"
                        multiline
                        rows={2}
                      />
                      
                      {validationErrors.timeRange && (
                        <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
                          {validationErrors.timeRange}
                        </Alert>
                      )}

                      {/* 編輯操作按鈕 */}
                      <Box display="flex" gap={1} mt={2}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<SaveIcon />}
                          onClick={handleSave}
                          disabled={loading}
                        >
                          保存
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                        >
                          取消
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    /* 顯示模式 */
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        時間範圍
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        {currentTimes.start} - {currentTimes.end}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        工時
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {calculateHours(currentTimes.start, currentTimes.end)}
                      </Typography>

                      {config?.description && (
                        <>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            描述
                          </Typography>
                          <Typography variant="body2">
                            {config.description}
                          </Typography>
                        </>
                      )}

                      {config && (
                        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                          最後更新: {new Date(config.updatedAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShiftTimeConfigManager;