import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField,
  InputAdornment,
  SelectChangeEvent,
  Box,
  Chip,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import { AccessTime, Settings } from '@mui/icons-material';
import { Employee } from '@pharmacy-pos/shared/types/entities';
import { OvertimeStatus } from '@pharmacy-pos/shared/utils/overtimeDataProcessor';
import { calculateOvertimeHours, OvertimeCalculationResult } from '../../utils/overtimeTimeCalculator';

// 定義表單數據介面
interface TimeCalculationFormData {
  employeeId: string;
  date: string;
  hours: string | number;
  description: string;
  status: OvertimeStatus;
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

// 定義元件 Props 介面
interface TimeCalculationOvertimeDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  formData: TimeCalculationFormData;
  formErrors: FormErrors;
  employees?: Employee[];
  employeeId: string | null;
  isAdmin: boolean;
  submitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  onSubmit: () => Promise<boolean | void>;
  submitButtonText?: string;
}

/**
 * 時間計算加班記錄對話框組件
 * 專門處理時間計算加班時數的對話框
 */
const TimeCalculationOvertimeDialog: React.FC<TimeCalculationOvertimeDialogProps> = ({
  open,
  onClose,
  title,
  formData,
  formErrors,
  employees = [],
  employeeId,
  submitting,
  onInputChange,
  onSubmit,
  submitButtonText = '確認'
}) => {
  // 本地狀態管理
  const [calculationResult, setCalculationResult] = useState<OvertimeCalculationResult | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  // 當對話框打開時，自動設置當前時間並計算
  useEffect(() => {
    if (open) {
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setSelectedTime(timeString);
      setIsManualMode(false);
      
      // 自動計算當前時間的加班時數
      handleTimeCalculation(timeString);
    }
  }, [open]);

  // 處理時間計算
  const handleTimeCalculation = useCallback(async (timeInput: string) => {
    setCalculating(true);
    try {
      const result = await calculateOvertimeHours(timeInput);
      setCalculationResult(result);
      
      // 自動更新表單中的小時數
      const hoursSyntheticEvent = {
        target: {
          name: 'hours',
          value: result.hours.toString()
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(hoursSyntheticEvent);

      // 根據模式決定是否自動填入加班原因
      if (!isManualMode) {
        const shiftNames = {
          morning: '早班',
          afternoon: '中班',
          evening: '晚班'
        };
        const shiftDisplayName = shiftNames[result.nearestShift as keyof typeof shiftNames] || result.nearestShift;
        const descriptionText = `加班時間: ${timeInput} (${shiftDisplayName}下班後加班 ${result.hours} 小時)`;
        const descriptionSyntheticEvent = {
          target: {
            name: 'description',
            value: descriptionText
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onInputChange(descriptionSyntheticEvent);
      }
      
    } catch (error) {
      console.error('計算加班時數失敗:', error);
      setCalculationResult(null);
    } finally {
      setCalculating(false);
    }
  }, [onInputChange, isManualMode]);

  // 處理時間變更
  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    if (newTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
      handleTimeCalculation(newTime);
    }
  }, [handleTimeCalculation]);

  // 處理手動調整模式切換
  const handleManualModeToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newManualMode = event.target.checked;
    setIsManualMode(newManualMode);
    
    if (newManualMode && calculationResult && selectedTime) {
      // 切換到手動模式時，將時間信息填入加班原因
      const shiftNames = {
        morning: '早班',
        afternoon: '中班',
        evening: '晚班'
      };
      const shiftDisplayName = shiftNames[calculationResult.nearestShift as keyof typeof shiftNames] || calculationResult.nearestShift;
      const descriptionText = `加班時間: ${selectedTime} (${shiftDisplayName}下班後加班 ${calculationResult.hours} 小時)`;
      
      const descriptionSyntheticEvent = {
        target: {
          name: 'description',
          value: descriptionText
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onInputChange(descriptionSyntheticEvent);
    } else if (!newManualMode && calculationResult && selectedTime) {
      // 切換回自動模式時，重新設置加班原因
      const shiftNames = {
        morning: '早班',
        afternoon: '中班',
        evening: '晚班'
      };
      const shiftDisplayName = shiftNames[calculationResult.nearestShift as keyof typeof shiftNames] || calculationResult.nearestShift;
      const descriptionText = `加班時間: ${selectedTime} (${shiftDisplayName}下班後加班 ${calculationResult.hours} 小時)`;
      
      const descriptionSyntheticEvent = {
        target: {
          name: 'description',
          value: descriptionText
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onInputChange(descriptionSyntheticEvent);
    }
  }, [calculationResult, selectedTime, onInputChange]);

  // 獲取班次顯示名稱
  const getShiftDisplayName = useMemo(() => (shift: string): string => {
    const shiftNames = {
      morning: '早班',
      afternoon: '中班',
      evening: '晚班'
    };
    return shiftNames[shift as keyof typeof shiftNames] || shift;
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AccessTime color="primary" />
            {title}
          </div>
          <FormControlLabel
            control={
              <Switch
                checked={isManualMode}
                onChange={handleManualModeToggle}
                color="primary"
              />
            }
            label="手動調整"
          />
        </div>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!formErrors.employeeId}>
              <InputLabel id="employee-select-label">員工</InputLabel>
              <Select
                labelId="employee-select-label"
                name="employeeId"
                value={formData.employeeId}
                onChange={onInputChange}
                label="員工"
                disabled={!!employeeId}
              >
                {employees && employees.length > 0 ? employees.map((employee) => (
                  <MenuItem key={employee._id} value={employee._id}>
                    {employee.name}
                  </MenuItem>
                )) : (
                  <MenuItem value="" disabled>
                    沒有可選擇的員工
                  </MenuItem>
                )}
              </Select>
              {formErrors.employeeId && (
                <Typography color="error" variant="caption">
                  {formErrors.employeeId}
                </Typography>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="加班日期"
              name="date"
              type="date"
              value={formData.date}
              onChange={onInputChange}
              fullWidth
              disabled={!isManualMode}
              InputLabelProps={{
                shrink: true,
              }}
              error={!!formErrors.date}
              helperText={formErrors.date}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="選擇時間"
              value={selectedTime}
              onChange={handleTimeChange}
              type="time"
              fullWidth
              disabled={!isManualMode}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 60, // 1分鐘間隔
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="計算得出的加班時數"
              name="hours"
              value={formData.hours}
              onChange={onInputChange}
              fullWidth
              type="number"
              disabled={!isManualMode}
              inputProps={{ min: 0, max: 24, step: 0.01 }}
              error={!!formErrors.hours}
              InputProps={{
                endAdornment: <InputAdornment position="end">小時</InputAdornment>,
              }}
            />
          </Grid>
          
          {/* 加班原因/說明 - 自動模式時顯示但不可編輯，手動模式時可編輯 */}
          <Grid item xs={12}>
            <TextField
              label="加班原因/說明"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              fullWidth
              multiline
              rows={3}
              disabled={!isManualMode}
              placeholder={isManualMode ? "請描述加班原因或工作內容..." : "系統自動計算的加班說明"}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={async () => {
            // 調用提交函數
            const result = await onSubmit();
            // 如果提交成功，直接關閉對話框
            if (result === true) {
              onClose();
            }
          }}
          disabled={submitting || !calculationResult}
          variant="contained"
          color="primary"
          startIcon={<AccessTime />}
        >
          {submitting ? '處理中...' : submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimeCalculationOvertimeDialog;