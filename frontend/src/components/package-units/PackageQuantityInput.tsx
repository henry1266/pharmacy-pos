import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  Chip,
  Button,
  Grid,
  Paper,
  Divider,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Autocomplete,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Calculate as CalculatorIcon
} from '@mui/icons-material';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import { PackageQuantityInputProps, PackageInputItem } from './types';
import { 
  convertToBaseUnit, 
  convertToPackageDisplay, 
  generateQuickInputOptions,
  formatPackageDisplay 
} from './utils';

/**
 * 包裝數量輸入組件
 * 支援多種包裝單位的數量輸入和快捷操作
 */
const PackageQuantityInput: React.FC<PackageQuantityInputProps> = ({
  packageUnits,
  value = 0,
  onChange,
  label = '數量',
  placeholder = '請輸入數量',
  disabled = false,
  error,
  helperText,
  showQuickInput = true,
  showCalculator = true,
  allowNegative = false,
  maxValue,
  variant = 'outlined'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
  // 狀態管理
  const [inputValues, setInputValues] = useState<PackageInputItem[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputError, setInputError] = useState<string>('');
  const [inputWarning, setInputWarning] = useState<string>('');
  const [quickInputExpanded, setQuickInputExpanded] = useState(false);
  const [historyInputs, setHistoryInputs] = useState<number[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<number[]>([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);

  // 排序後的包裝單位（按 unitValue 從大到小排序）
  const sortedPackageUnits = useMemo(() => {
    return [...packageUnits].sort((a, b) => b.unitValue - a.unitValue);
  }, [packageUnits]);

  // 基礎單位
  const baseUnit = useMemo(() => {
    return packageUnits.find(u => u.unitValue === Math.min(...packageUnits.map(p => p.unitValue)));
  }, [packageUnits]);

  // 快捷輸入選項
  const quickInputOptions = useMemo(() => {
    return generateQuickInputOptions(packageUnits);
  }, [packageUnits]);

  // 智能建議生成
  const generateSmartSuggestions = useCallback((currentValue: number): number[] => {
    const suggestions = new Set<number>();
    
    // 基於當前值的倍數建議
    if (currentValue > 0) {
      suggestions.add(Math.floor(currentValue * 0.5));
      suggestions.add(currentValue * 2);
      suggestions.add(currentValue * 3);
      suggestions.add(currentValue * 5);
    }
    
    // 基於包裝單位的常見數量
    packageUnits.forEach(unit => {
      suggestions.add(unit.unitValue);
      suggestions.add(unit.unitValue * 2);
      suggestions.add(unit.unitValue * 5);
      suggestions.add(unit.unitValue * 10);
    });
    
    // 常見的整數建議
    [1, 5, 10, 20, 50, 100].forEach(num => suggestions.add(num));
    
    return Array.from(suggestions)
      .filter(val => val > 0 && val !== currentValue)
      .sort((a, b) => a - b)
      .slice(0, 8);
  }, [packageUnits]);

  // 歷史輸入管理
  const addToHistory = useCallback((value: number) => {
    if (value > 0) {
      setHistoryInputs(prev => {
        const newHistory = [value, ...prev.filter(v => v !== value)].slice(0, 10);
        // 可以在這裡添加 localStorage 持久化
        try {
          localStorage.setItem('packageQuantityHistory', JSON.stringify(newHistory));
        } catch (e) {
          console.warn('無法保存歷史記錄到 localStorage');
        }
        return newHistory;
      });
    }
  }, []);

  // 從 localStorage 載入歷史記錄
  useEffect(() => {
    try {
      const saved = localStorage.getItem('packageQuantityHistory');
      if (saved) {
        const history = JSON.parse(saved);
        if (Array.isArray(history)) {
          setHistoryInputs(history.slice(0, 10));
        }
      }
    } catch (e) {
      console.warn('無法從 localStorage 載入歷史記錄');
    }
  }, []);

  // 更新智能建議
  useEffect(() => {
    const suggestions = generateSmartSuggestions(value);
    setSmartSuggestions(suggestions);
  }, [value, generateSmartSuggestions]);

  // 初始化輸入值
  useEffect(() => {
    const displayResult = convertToPackageDisplay(value, packageUnits);
    const newInputValues = sortedPackageUnits.map(unit => {
      const breakdown = displayResult.packageBreakdown.find(b => b.unitName === unit.unitName);
      return {
        unitName: unit.unitName,
        quantity: breakdown?.quantity || 0,
        unitValue: unit.unitValue
      };
    });
    setInputValues(newInputValues);
  }, [value, packageUnits, sortedPackageUnits]);

  // 計算總基礎單位數量
  const calculateTotalBaseUnits = useCallback((inputs: PackageInputItem[]): number => {
    return inputs.reduce((total, item) => total + (item.quantity * item.unitValue), 0);
  }, []);

  // 為特定包裝單位生成建議
  const generateUnitSpecificSuggestions = useCallback((unit: ProductPackageUnit): number[] => {
    const suggestions = new Set<number>();
    
    // 常見的包裝單位數量
    [1, 2, 3, 5, 10, 20, 50].forEach(num => suggestions.add(num));
    
    // 基於當前總值計算的建議
    const currentTotal = calculateTotalBaseUnits(inputValues);
    if (currentTotal > 0) {
      const currentUnitQuantity = Math.floor(currentTotal / unit.unitValue);
      if (currentUnitQuantity > 0) {
        suggestions.add(currentUnitQuantity);
        suggestions.add(currentUnitQuantity + 1);
        suggestions.add(Math.max(1, currentUnitQuantity - 1));
      }
    }
    
    return Array.from(suggestions)
      .filter(val => val > 0)
      .sort((a, b) => a - b)
      .slice(0, 6);
  }, [inputValues, calculateTotalBaseUnits]);

  // 輸入驗證函數
  const validateInput = useCallback((value: number, unitName?: string): string => {
    // 檢查負數
    if (!allowNegative && value < 0) {
      return '數量不能為負數';
    }
    
    // 檢查最大值
    if (maxValue && value > maxValue) {
      return `數量不能超過 ${maxValue}`;
    }
    
    // 檢查是否為整數
    if (!Number.isInteger(value)) {
      return '請輸入整數';
    }
    
    // 檢查包裝單位特定驗證
    if (unitName) {
      const unit = packageUnits.find(u => u.unitName === unitName);
      if (unit && value > 0) {
        // 可以添加特定包裝單位的驗證邏輯
        // 例如：某些包裝單位可能有特定的數量限制
      }
    }
    
    return '';
  }, [allowNegative, maxValue, packageUnits]);

  // 警告檢查函數
  const checkWarnings = useCallback((value: number): string => {
    // 檢查是否為異常大的數量
    if (value > 10000) {
      return '數量較大，請確認是否正確';
    }
    
    // 檢查是否可以用更大的包裝單位表示
    if (value > 0 && packageUnits.length > 1) {
      const largestUnit = packageUnits.reduce((max, unit) =>
        unit.unitValue > max.unitValue ? unit : max
      );
      
      if (largestUnit.unitValue > 1 && value >= largestUnit.unitValue * 10) {
        return `建議使用 ${largestUnit.unitName} 作為輸入單位`;
      }
    }
    
    return '';
  }, [packageUnits]);

  // 處理單個輸入變更
  const handleInputChange = useCallback((unitName: string, quantity: number) => {
    // 先進行基本清理
    const cleanQuantity = Math.max(0, Math.floor(quantity));
    
    const newInputValues = inputValues.map(item =>
      item.unitName === unitName ? { ...item, quantity: cleanQuantity } : item
    );
    
    const totalBaseUnits = calculateTotalBaseUnits(newInputValues);
    
    // 驗證總數量
    const validationError = validateInput(totalBaseUnits);
    if (validationError) {
      setInputError(validationError);
      return;
    }
    
    // 驗證單個包裝單位數量
    const unitValidationError = validateInput(cleanQuantity, unitName);
    if (unitValidationError) {
      setInputError(unitValidationError);
      return;
    }
    
    setInputError('');
    
    // 檢查警告
    const warning = checkWarnings(totalBaseUnits);
    setInputWarning(warning);
    
    setInputValues(newInputValues);
    onChange(totalBaseUnits);
    
    // 添加到歷史記錄
    if (totalBaseUnits > 0) {
      addToHistory(totalBaseUnits);
    }
  }, [inputValues, calculateTotalBaseUnits, validateInput, checkWarnings, onChange, addToHistory]);

  // 快捷輸入處理
  const handleQuickInput = useCallback((baseUnits: number) => {
    const displayResult = convertToPackageDisplay(baseUnits, packageUnits);
    const newInputValues = sortedPackageUnits.map(unit => {
      const breakdown = displayResult.packageBreakdown.find(b => b.unitName === unit.unitName);
      return {
        unitName: unit.unitName,
        quantity: breakdown?.quantity || 0,
        unitValue: unit.unitValue
      };
    });
    
    setInputValues(newInputValues);
    onChange(baseUnits);
  }, [packageUnits, sortedPackageUnits, onChange]);

  // 清空輸入
  const handleClear = useCallback(() => {
    const clearedInputs = inputValues.map(item => ({ ...item, quantity: 0 }));
    setInputValues(clearedInputs);
    setInputError('');
    onChange(0);
  }, [inputValues, onChange]);

  // 增減按鈕處理
  const handleIncrement = useCallback((unitName: string, step: number = 1) => {
    const item = inputValues.find(i => i.unitName === unitName);
    if (item) {
      handleInputChange(unitName, item.quantity + step);
    }
  }, [inputValues, handleInputChange]);

  const handleDecrement = useCallback((unitName: string, step: number = 1) => {
    const item = inputValues.find(i => i.unitName === unitName);
    if (item) {
      handleInputChange(unitName, Math.max(0, item.quantity - step));
    }
  }, [inputValues, handleInputChange]);

  // 當前總數顯示
  const currentTotal = useMemo(() => {
    const total = calculateTotalBaseUnits(inputValues);
    return convertToPackageDisplay(total, packageUnits);
  }, [inputValues, calculateTotalBaseUnits, packageUnits]);

  return (
    <Box>
      {/* 標籤 */}
      {label && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}

      {/* 主要輸入區域 */}
      <Paper
        elevation={1}
        sx={{
          p: isMobile ? 1.5 : 2,
          borderRadius: isMobile ? 1 : 2,
          border: error || inputError ? `1px solid ${theme.palette.error.main}` : undefined,
          mx: isMobile ? -0.5 : 0
        }}
      >
        {/* 簡化輸入模式 */}
        {!showAdvanced && (
          <Box>
            <Autocomplete
              freeSolo
              fullWidth
              options={[...historyInputs, ...smartSuggestions].filter((v, i, arr) => arr.indexOf(v) === i)}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.toString()}
              value={value}
              inputValue={value.toString()}
              onInputChange={(event, newValue) => {
                const numValue = Math.max(0, parseInt(newValue) || 0);
                
                // 驗證輸入
                const validationError = validateInput(numValue);
                if (validationError) {
                  setInputError(validationError);
                  return;
                }
                
                setInputError('');
                
                // 檢查警告
                const warning = checkWarnings(numValue);
                setInputWarning(warning);
                
                onChange(numValue);
                if (numValue > 0) {
                  addToHistory(numValue);
                }
              }}
              onChange={(event, newValue) => {
                if (typeof newValue === 'number') {
                  onChange(newValue);
                  addToHistory(newValue);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  type="number"
                  label={`${label} (${baseUnit?.unitName || '個'})`}
                  placeholder={placeholder}
                  disabled={disabled}
                  error={!!(error || inputError)}
                  helperText={error || inputError || helperText}
                  variant={variant}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {params.InputProps.endAdornment}
                        {showCalculator && (
                          <Tooltip title="切換到高級輸入模式">
                            <IconButton
                              onClick={() => setShowAdvanced(true)}
                              size="small"
                            >
                              <CalculatorIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )
                  }}
                />
              )}
              renderOption={(props, option) => (
                <ListItem {...props}>
                  <ListItemText
                    primary={option.toString()}
                    secondary={
                      historyInputs.includes(option as number)
                        ? '歷史記錄'
                        : '智能建議'
                    }
                  />
                </ListItem>
              )}
            />
          </Box>
        )}

        {/* 高級輸入模式 */}
        {showAdvanced && (
          <Box>
            {/* 包裝單位輸入 */}
            <Grid container spacing={2}>
              {sortedPackageUnits.map((unit, index) => {
                const unitSuggestions = generateUnitSpecificSuggestions(unit);
                const currentValue = inputValues.find(i => i.unitName === unit.unitName)?.quantity || 0;
                
                return (
                  <Grid item xs={12} sm={isMobile ? 12 : 6} md={isTablet ? 6 : 4} lg={3} key={unit.unitName}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 0.5 : 1,
                      flexDirection: isMobile && packageUnits.length > 3 ? 'column' : 'row'
                    }}>
                      {(!isMobile || packageUnits.length <= 3) && (
                        <IconButton
                          size={isMobile ? "medium" : "small"}
                          onClick={() => handleDecrement(unit.unitName)}
                          disabled={disabled}
                          sx={{
                            minWidth: isMobile ? 44 : 'auto',
                            height: isMobile ? 44 : 'auto'
                          }}
                        >
                          <RemoveIcon />
                        </IconButton>
                      )}
                      
                      <Autocomplete
                        freeSolo
                        size={isMobile ? "medium" : "small"}
                        options={unitSuggestions}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.toString()}
                        value={currentValue}
                        inputValue={currentValue.toString()}
                        onInputChange={(event, newValue) => {
                          const numValue = Math.max(0, parseInt(newValue) || 0);
                          handleInputChange(unit.unitName, numValue);
                        }}
                        onChange={(event, newValue) => {
                          if (typeof newValue === 'number') {
                            handleInputChange(unit.unitName, newValue);
                          }
                        }}
                        sx={{
                          flexGrow: 1,
                          minWidth: isMobile ? '100%' : '80px',
                          width: isMobile && packageUnits.length > 3 ? '100%' : 'auto'
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            type="number"
                            label={unit.unitName}
                            disabled={disabled}
                            inputProps={{
                              ...params.inputProps,
                              min: 0,
                              style: {
                                fontSize: isMobile ? '16px' : '14px', // 防止 iOS 縮放
                                ...params.inputProps.style
                              }
                            }}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: isMobile && packageUnits.length > 3 ? (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {params.InputProps.endAdornment}
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDecrement(unit.unitName)}
                                    disabled={disabled}
                                  >
                                    <RemoveIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleIncrement(unit.unitName)}
                                    disabled={disabled}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Box>
                              ) : params.InputProps.endAdornment
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <ListItem {...props}>
                            <ListItemText
                              primary={option.toString()}
                              secondary="建議值"
                            />
                          </ListItem>
                        )}
                      />
                      
                      {(!isMobile || packageUnits.length <= 3) && (
                        <IconButton
                          size={isMobile ? "medium" : "small"}
                          onClick={() => handleIncrement(unit.unitName)}
                          disabled={disabled}
                          sx={{
                            minWidth: isMobile ? 44 : 'auto',
                            height: isMobile ? 44 : 'auto'
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* 錯誤提示 */}
            <Collapse in={!!(error || inputError)}>
              <Alert severity="error" sx={{ mt: 1 }}>
                {error || inputError}
              </Alert>
            </Collapse>

            {/* 警告提示 */}
            <Collapse in={!!inputWarning && !error && !inputError}>
              <Alert severity="warning" sx={{ mt: 1 }}>
                {inputWarning}
              </Alert>
            </Collapse>

            {/* 操作按鈕 */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 0
            }}>
              <Button
                variant="outlined"
                size={isMobile ? "medium" : "small"}
                onClick={() => setShowAdvanced(false)}
                startIcon={<ExpandLessIcon />}
                fullWidth={isMobile}
              >
                簡化模式
              </Button>
              
              <Button
                variant="outlined"
                size={isMobile ? "medium" : "small"}
                onClick={handleClear}
                startIcon={<ClearIcon />}
                disabled={disabled}
                fullWidth={isMobile}
              >
                清空
              </Button>
            </Box>
          </Box>
        )}

        {/* 當前總數顯示 */}
        <Box sx={{
          mt: isMobile ? 1.5 : 2,
          pt: isMobile ? 1.5 : 2,
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Typography
            variant={isMobile ? "caption" : "body2"}
            color="text.secondary"
            sx={{ mb: isMobile ? 0.25 : 0.5 }}
          >
            當前總數：
          </Typography>
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            color="primary.main"
            fontWeight="bold"
            sx={{
              fontSize: isMobile ? '1.1rem' : undefined,
              lineHeight: isMobile ? 1.3 : undefined
            }}
          >
            {currentTotal.displayText}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: isMobile ? '0.75rem' : undefined,
              display: 'block',
              mt: isMobile ? 0.25 : 0
            }}
          >
            基礎單位：{calculateTotalBaseUnits(inputValues)} {baseUnit?.unitName || '個'}
          </Typography>
        </Box>

        {/* 錯誤提示 */}
        <Collapse in={!!(error || inputError)}>
          <Alert severity="error" sx={{ mt: 1 }}>
            {error || inputError}
          </Alert>
        </Collapse>

        {/* 警告提示 */}
        <Collapse in={!!inputWarning && !error && !inputError}>
          <Alert severity="warning" sx={{ mt: 1 }}>
            {inputWarning}
          </Alert>
        </Collapse>

        {/* 說明文字 */}
        {helperText && !error && !inputError && !inputWarning && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {helperText}
          </Typography>
        )}
      </Paper>

      {/* 快捷輸入選項 */}
      {showQuickInput && quickInputOptions.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              快捷輸入：
            </Typography>
            <IconButton
              size="small"
              onClick={() => setQuickInputExpanded(!quickInputExpanded)}
            >
              {quickInputExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={quickInputExpanded}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {quickInputOptions.slice(0,
                isMobile ? 4 :
                isTablet ? 8 :
                isSmallScreen ? 10 : 12
              ).map((option, index) => (
                <Chip
                  key={index}
                  label={option.displayText}
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickInput(option.baseUnits)}
                  disabled={disabled}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default PackageQuantityInput;