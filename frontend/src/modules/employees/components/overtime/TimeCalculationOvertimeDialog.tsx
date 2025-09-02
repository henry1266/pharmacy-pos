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
  FormControlLabel,
  Card,
  CardContent
} from '@mui/material';
import { AccessTime, Settings, ArrowBack } from '@mui/icons-material';
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
  submitting: _submitting, // 重命名為 _submitting 以避免未使用警告
  onInputChange,
  onSubmit,
  submitButtonText: _submitButtonText = '確認' // 重命名為 _submitButtonText 以避免未使用警告
}) => {
  // 定義步驟枚舉
  enum Step {
    ModeSelection = 0,
    AutoModeEmployeeSelection = 1,
    ManualModeDateTime = 1,
    ManualModeEmployeeSelection = 2,
    ManualModeDescription = 3
  }

  // 本地狀態管理
  const [calculationResult, setCalculationResult] = useState<OvertimeCalculationResult | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState<boolean | null>(null); // null 表示尚未選擇模式
  const [currentStep, setCurrentStep] = useState<Step>(Step.ModeSelection);
  const [hasUserInteractedWithTime, setHasUserInteractedWithTime] = useState<boolean>(false);
  const [hasUserInteractedWithDate, setHasUserInteractedWithDate] = useState<boolean>(false);
  const [isDateTimeComplete, setIsDateTimeComplete] = useState<boolean>(false);

  // 當對話框打開時，重置狀態
  useEffect(() => {
    if (open) {
      // 重置所有狀態
      setCurrentStep(Step.ModeSelection);
      setIsManualMode(null);
      setSelectedTime('');
      setHasUserInteractedWithTime(false);
      setHasUserInteractedWithDate(false);
      setIsDateTimeComplete(false);
      setCalculationResult(null);
      
      // 設置當前日期為預設值
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const dateSyntheticEvent = {
        target: {
          name: 'date',
          value: dateStr
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(dateSyntheticEvent);
    }
  }, [open, onInputChange]);

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
      
    } catch (error) {
      console.error('計算加班時數失敗:', error);
      setCalculationResult(null);
    } finally {
      setCalculating(false);
    }
  }, [onInputChange]);

  // 處理時間變更
  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    setHasUserInteractedWithTime(true); // 標記用戶已經與時間欄位互動
    if (newTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
      handleTimeCalculation(newTime);
    }
  }, [handleTimeCalculation]);

  // 處理時間欄位獲得焦點
  const handleTimeFocus = useCallback(() => {
    setHasUserInteractedWithTime(true); // 標記用戶已經與時間欄位互動
  }, []);

  // 獲取班次顯示名稱
  const getShiftDisplayName = useMemo(() => (shift: string): string => {
    const shiftNames = {
      morning: '早班',
      afternoon: '中班',
      evening: '晚班'
    };
    return shiftNames[shift as keyof typeof shiftNames] || shift;
  }, []);

  // 檢查必填欄位是否都已填寫完整
  const areRequiredFieldsFilled = useMemo(() => {
    // 在手動模式下，需要確認用戶已經與時間欄位互動
    const isTimeValid = isManualMode ? (selectedTime && hasUserInteractedWithTime) : !!selectedTime;
    
    return !!(
      formData.employeeId &&
      formData.date &&
      isTimeValid &&
      formData.hours
    );
  }, [formData.employeeId, formData.date, selectedTime, formData.hours, isManualMode, hasUserInteractedWithTime]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AccessTime color="primary" />
          {title}
        </div>
      </DialogTitle>
      <DialogContent>
        {/* 步驟導航 */}
        {currentStep > Step.ModeSelection && (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => {
                if (isManualMode) {
                  if (currentStep === Step.ManualModeDateTime) {
                    setCurrentStep(Step.ModeSelection);
                  } else if (currentStep === Step.ManualModeEmployeeSelection) {
                    setCurrentStep(Step.ManualModeDateTime);
                  } else if (currentStep === Step.ManualModeDescription) {
                    setCurrentStep(Step.ManualModeEmployeeSelection);
                  }
                } else {
                  setCurrentStep(Step.ModeSelection);
                }
              }}
            >
              返回上一步
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              {isManualMode ?
                `步驟 ${currentStep}/${Step.ManualModeDescription}` :
                `步驟 ${currentStep}/${Step.AutoModeEmployeeSelection}`}
            </Typography>
          </Box>
        )}
        
        {/* 步驟 2 (手動模式): 員工選擇 */}
        {isManualMode && currentStep === Step.ManualModeEmployeeSelection && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom align="center">
              手動模式 - 選擇員工
            </Typography>
            
            <Card sx={{ mb: 3, mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  已選擇的日期和時間
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="加班日期"
                      value={formData.date}
                      fullWidth
                      disabled
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="加班時間"
                      value={selectedTime}
                      fullWidth
                      disabled
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <FormControl fullWidth error={!!formErrors.employeeId} sx={{ mt: 2 }}>
              <InputLabel id="employee-select-label">選擇員工</InputLabel>
              <Select
                labelId="employee-select-label"
                name="employeeId"
                value={formData.employeeId}
                onChange={onInputChange}
                label="選擇員工"
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
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={!formData.employeeId}
                onClick={() => {
                  // 自動生成說明文字
                  if (calculationResult) {
                    const shiftNames = {
                      morning: '早班',
                      afternoon: '中班',
                      evening: '晚班'
                    };
                    const shiftDisplayName = shiftNames[calculationResult.nearestShift as keyof typeof shiftNames] || calculationResult.nearestShift;
                    const currentTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
                    const descriptionText = `加班時間: ${selectedTime} (${shiftDisplayName}下班後加班 ${calculationResult.hours} 小時)\n填寫時間: ${currentTime}`;
                    
                    const descriptionSyntheticEvent = {
                      target: {
                        name: 'description',
                        value: descriptionText
                      }
                    } as React.ChangeEvent<HTMLInputElement>;
                    
                    onInputChange(descriptionSyntheticEvent);
                  }
                  
                  setCurrentStep(Step.ManualModeDescription);
                }}
              >
                下一步
              </Button>
            </Box>
          </Box>
        )}
        
        {/* 步驟 3 (手動模式): 說明欄位 */}
        {isManualMode && currentStep === Step.ManualModeDescription && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom align="center">
              手動模式 - 確認加班資訊
            </Typography>
            
            <Card sx={{ mb: 3, mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  加班資訊摘要
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="加班日期"
                      value={formData.date}
                      fullWidth
                      disabled
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="加班時間"
                      value={selectedTime}
                      fullWidth
                      disabled
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="員工"
                      value={employees?.find(e => e._id === formData.employeeId)?.name || ''}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="計算得出的加班時數"
                      value={formData.hours}
                      fullWidth
                      disabled
                      InputProps={{
                        endAdornment: <InputAdornment position="end">小時</InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <TextField
              label="加班原因/說明"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              fullWidth
              multiline
              rows={4}
              sx={{ mt: 2 }}
              placeholder="請描述加班原因或工作內容..."
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  // 調用提交函數
                  const result = await onSubmit();
                  // 如果提交成功，直接關閉對話框
                  if (result === true) {
                    onClose();
                  }
                }}
              >
                確認打卡
              </Button>
            </Box>
          </Box>
        )}

        {/* 步驟 1 (自動模式): 時間顯示和員工選擇 */}
        {!isManualMode && currentStep === Step.AutoModeEmployeeSelection && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom align="center">
              自動模式 - 選擇員工
            </Typography>
            
            <Card sx={{ mb: 3, mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  系統已自動計算加班時間
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="當前時間"
                      value={selectedTime}
                      fullWidth
                      disabled
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="計算得出的加班時數"
                      value={formData.hours}
                      fullWidth
                      disabled
                      InputProps={{
                        endAdornment: <InputAdornment position="end">小時</InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <FormControl fullWidth error={!!formErrors.employeeId} sx={{ mt: 2 }}>
              <InputLabel id="employee-select-label">選擇員工</InputLabel>
              <Select
                labelId="employee-select-label"
                name="employeeId"
                value={formData.employeeId}
                onChange={onInputChange}
                label="選擇員工"
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
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={!formData.employeeId}
                onClick={async () => {
                  // 自動生成說明文字
                  if (calculationResult) {
                    const shiftNames = {
                      morning: '早班',
                      afternoon: '中班',
                      evening: '晚班'
                    };
                    const shiftDisplayName = shiftNames[calculationResult.nearestShift as keyof typeof shiftNames] || calculationResult.nearestShift;
                    const currentTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
                    const descriptionText = `加班時間: ${selectedTime}\n填寫時間: ${currentTime} (${shiftDisplayName}下班後加班 ${calculationResult.hours} 小時)`;
                    
                    const descriptionSyntheticEvent = {
                      target: {
                        name: 'description',
                        value: descriptionText
                      }
                    } as React.ChangeEvent<HTMLInputElement>;
                    
                    onInputChange(descriptionSyntheticEvent);
                  }
                  
                  // 調用提交函數
                  const result = await onSubmit();
                  // 如果提交成功，直接關閉對話框
                  if (result === true) {
                    onClose();
                  }
                }}
              >
                確認打卡
              </Button>
            </Box>
          </Box>
        )}
        
        {/* 步驟 1 (手動模式): 日期和時間選擇 */}
        {isManualMode && currentStep === Step.ManualModeDateTime && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom align="center">
              手動模式 - 選擇日期和時間
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="加班日期"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    onInputChange(e);
                    setHasUserInteractedWithDate(true);
                  }}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!!formErrors.date}
                  helperText={formErrors.date}
                  onFocus={() => setHasUserInteractedWithDate(true)}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="加班時間"
                  value={selectedTime}
                  onChange={(e) => {
                    handleTimeChange(e);
                    setHasUserInteractedWithTime(true);
                  }}
                  type="time"
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 60, // 1分鐘間隔
                  }}
                  onFocus={handleTimeFocus}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={!formData.date || !selectedTime || !hasUserInteractedWithDate || !hasUserInteractedWithTime}
                onClick={() => {
                  setIsDateTimeComplete(true);
                  setCurrentStep(Step.ManualModeEmployeeSelection);
                }}
              >
                下一步
              </Button>
            </Box>
          </Box>
        )}

        {/* 步驟 0: 模式選擇 */}
        {currentStep === Step.ModeSelection && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom align="center">
              請選擇加班打卡模式
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
              <Card
                sx={{
                  width: '45%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.03)', boxShadow: 3 },
                  border: isManualMode === false ? '2px solid #3f51b5' : 'none'
                }}
                onClick={() => {
                  setIsManualMode(false);
                  // 自動計算當前時間的加班時數
                  const now = new Date();
                  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                  setSelectedTime(timeString);
                  handleTimeCalculation(timeString);
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <AccessTime sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    自動模式
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    系統自動計算當前時間的加班時數
                  </Typography>
                </CardContent>
              </Card>
              
              <Card
                sx={{
                  width: '45%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.03)', boxShadow: 3 },
                  border: isManualMode === true ? '2px solid #3f51b5' : 'none'
                }}
                onClick={() => {
                  setIsManualMode(true);
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Settings sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    手動模式
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    手動設定加班日期、時間和時數
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={isManualMode === null}
                onClick={() => {
                  if (isManualMode === false) {
                    setCurrentStep(Step.AutoModeEmployeeSelection);
                  } else {
                    setCurrentStep(Step.ManualModeDateTime);
                  }
                }}
              >
                下一步
              </Button>
            </Box>
          </Box>
        )}
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
              onFocus={handleTimeFocus}
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
          
          {/* 加班原因/說明 - 自動模式時顯示但不可編輯，手動模式且必填欄位都已填寫完整時可編輯 */}
          <Grid item xs={12}>
            <TextField
              label="加班原因/說明"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              fullWidth
              multiline
              rows={3}
              disabled={!isManualMode || !areRequiredFieldsFilled}
              placeholder={isManualMode ?
                (areRequiredFieldsFilled ? "請描述加班原因或工作內容..." : "請先填寫上方所有必填欄位")
                : "系統自動計算的加班說明"}
              helperText={isManualMode && !areRequiredFieldsFilled ? "請先填寫員工、加班日期、選擇時間和加班時數" : ""}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>關閉</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimeCalculationOvertimeDialog;