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
  Alert
} from '@mui/material';
import { AccessTime, Calculate } from '@mui/icons-material';
import { Employee } from '@pharmacy-pos/shared/types/entities';
import { OvertimeStatus } from '@pharmacy-pos/shared/utils/overtimeDataProcessor';
import { calculateOvertimeHours, OvertimeCalculationResult } from '../../utils/overtimeTimeCalculator';

// 定義表單數據介面
interface FormData {
  employeeId: string;
  date: string;
  hours: string | number;
  description: string;
  status: OvertimeStatus;
  inputMode: 'manual' | 'time'; // 新增：輸入模式
  currentTime: string; // 新增：當前時間輸入
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
interface OvertimeRecordDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  formData: FormData;
  formErrors: FormErrors;
  employees?: Employee[];
  employeeId: string | null;
  isAdmin: boolean;
  submitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  onSubmit: () => void;
  submitButtonText?: string;
}

/**
 * 加班記錄對話框組件
 * 統一處理創建和編輯加班記錄的對話框，消除重複的表單結構
 */
const OvertimeRecordDialog: React.FC<OvertimeRecordDialogProps> = ({
  open,
  onClose,
  title,
  formData,
  formErrors,
  employees = [],
  employeeId,
  isAdmin,
  submitting,
  onInputChange,
  onSubmit,
  submitButtonText = '確認'
}) => {
  // 本地狀態管理
  const [calculationResult, setCalculationResult] = useState<OvertimeCalculationResult | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);

  // 使用 formData 中的 inputMode 和 currentTime，如果沒有則使用預設值
  const inputMode = formData.inputMode || 'manual';
  const currentTime = formData.currentTime || '';

  // 初始化當前時間
  useEffect(() => {
    if (open && !formData.currentTime) {
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // 通過 onInputChange 更新 currentTime
      const syntheticEvent = {
        target: {
          name: 'currentTime',
          value: timeString
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(syntheticEvent);
    }
  }, [open, formData.currentTime, onInputChange]);

  // 處理模式切換
  const handleModeSwitch = useCallback((newMode: 'manual' | 'time') => {
    // 如果與當前模式相同，不做任何操作
    if (newMode === inputMode) {
      return;
    }
    
    // 通過 onInputChange 更新 inputMode
    const syntheticEvent = {
      target: {
        name: 'inputMode',
        value: newMode
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(syntheticEvent);
    
    setCalculationResult(null);
    
    // 如果切換到時間模式，自動計算
    if (newMode === 'time') {
      setTimeout(async () => {
        setCalculating(true);
        try {
          const result = await calculateOvertimeHours(currentTime);
          setCalculationResult(result);
          
          // 自動更新表單中的小時數
          const hoursSyntheticEvent = {
            target: {
              name: 'hours',
              value: result.hours.toString()
            }
          } as React.ChangeEvent<HTMLInputElement>;
          onInputChange(hoursSyntheticEvent);
          
        } catch (error) {
          console.error('計算加班時數失敗:', error);
          setCalculationResult(null);
        } finally {
          setCalculating(false);
        }
      }, 100);
    }
  }, [inputMode, onInputChange, currentTime]);

  // 處理時間輸入變更
  const handleTimeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value;
    
    // 通過 onInputChange 更新 currentTime
    const syntheticEvent = {
      target: {
        name: 'currentTime',
        value: newTime
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(syntheticEvent);
    
    // 自動重新計算
    if (newTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
      // 直接調用計算函數，避免循環依賴
      setTimeout(() => {
        calculateOvertimeHours(newTime).then(result => {
          setCalculationResult(result);
          const hoursSyntheticEvent = {
            target: {
              name: 'hours',
              value: result.hours.toString()
            }
          } as React.ChangeEvent<HTMLInputElement>;
          onInputChange(hoursSyntheticEvent);
        }).catch(error => {
          console.error('計算加班時數失敗:', error);
          setCalculationResult(null);
        });
      }, 0);
    }
  }, [onInputChange]);

  // 處理時間計算
  const handleTimeCalculation = useCallback(async (timeInput?: string) => {
    setCalculating(true);
    try {
      const result = await calculateOvertimeHours(timeInput || currentTime);
      setCalculationResult(result);
      
      // 自動更新表單中的小時數
      const syntheticEvent = {
        target: {
          name: 'hours',
          value: result.hours.toString()
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(syntheticEvent);
      
    } catch (error) {
      console.error('計算加班時數失敗:', error);
      setCalculationResult(null);
    } finally {
      setCalculating(false);
    }
  }, [currentTime, onInputChange]);

  // 處理立即計算按鈕點擊
  const handleCalculateNow = useCallback(() => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // 通過 onInputChange 更新 currentTime
    const syntheticEvent = {
      target: {
        name: 'currentTime',
        value: timeString
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(syntheticEvent);
    
    handleTimeCalculation(timeString);
  }, [onInputChange, handleTimeCalculation]);

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
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }} {...({} as any)}>
          <Grid item xs={12} {...({} as any)}>
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
          
          <Grid item xs={12} sm={6} {...({} as any)}>
            <TextField
              label="加班日期"
              name="date"
              type="date"
              value={formData.date}
              onChange={onInputChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              error={!!formErrors.date}
              helperText={formErrors.date}
            />
          </Grid>
          
          <Grid item xs={12} {...({} as any)}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                加班時數輸入方式
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant={inputMode === 'manual' ? 'contained' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => handleModeSwitch('manual')}
                  startIcon={<Calculate />}
                >
                  手動輸入
                </Button>
                <Button
                  variant={inputMode === 'time' ? 'contained' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => handleModeSwitch('time')}
                  startIcon={<AccessTime />}
                >
                  時間計算
                </Button>
              </Box>
            </Box>

            {inputMode === 'manual' ? (
              <TextField
                label="加班時數"
                name="hours"
                value={formData.hours}
                onChange={onInputChange}
                fullWidth
                type="number"
                inputProps={{ min: 0.5, max: 24, step: 0.5 }}
                error={!!formErrors.hours}
                helperText={formErrors.hours}
                InputProps={{
                  endAdornment: <InputAdornment position="end">小時</InputAdornment>,
                }}
              />
            ) : (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="當前時間"
                    value={currentTime}
                    onChange={handleTimeChange}
                    fullWidth
                    type="time"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      step: 60, // 1分鐘間隔
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCalculateNow}
                    disabled={calculating}
                    startIcon={<AccessTime />}
                    fullWidth
                  >
                    {calculating ? '計算中...' : '使用當前時間'}
                  </Button>
                </Box>

                {calculationResult && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        {calculationResult.calculationDetails}
                      </Typography>
                    </Alert>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`最鄰近班別: ${getShiftDisplayName(calculationResult.nearestShift)}`}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={`下班時間: ${calculationResult.shiftEndTime}`}
                        color="secondary"
                        size="small"
                      />
                      <Chip
                        label={`加班時數: ${calculationResult.hours} 小時`}
                        color="success"
                        size="small"
                      />
                    </Box>
                  </Box>
                )}

                <TextField
                  label="計算得出的加班時數"
                  name="hours"
                  value={formData.hours}
                  onChange={onInputChange}
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, max: 24, step: 0.01 }}
                  error={!!formErrors.hours}
                  helperText={formErrors.hours || '此數值由時間自動計算得出，您也可以手動調整'}
                  sx={{ mt: 2 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">小時</InputAdornment>,
                  }}
                />
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} {...({} as any)}>
            <TextField
              label="加班原因/說明"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          
          {isAdmin && (
            <Grid item xs={12} {...({} as any)}>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">狀態</InputLabel>
                <Select
                  labelId="status-select-label"
                  name="status"
                  value={formData.status}
                  onChange={onInputChange}
                  label="狀態"
                >
                  <MenuItem value="pending">待審核</MenuItem>
                  <MenuItem value="approved">已核准</MenuItem>
                  <MenuItem value="rejected">已拒絕</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          variant="contained"
          color="primary"
        >
          {submitting ? '處理中...' : submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OvertimeRecordDialog;