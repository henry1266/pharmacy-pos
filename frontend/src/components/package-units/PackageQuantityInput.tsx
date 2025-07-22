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
  useMediaQuery
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
  
  // 狀態管理
  const [inputValues, setInputValues] = useState<PackageInputItem[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputError, setInputError] = useState<string>('');
  const [quickInputExpanded, setQuickInputExpanded] = useState(false);

  // 排序後的包裝單位（按優先級排序）
  const sortedPackageUnits = useMemo(() => {
    return [...packageUnits].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [packageUnits]);

  // 基礎單位
  const baseUnit = useMemo(() => {
    return packageUnits.find(u => u.unitValue === Math.min(...packageUnits.map(p => p.unitValue)));
  }, [packageUnits]);

  // 快捷輸入選項
  const quickInputOptions = useMemo(() => {
    return generateQuickInputOptions(packageUnits);
  }, [packageUnits]);

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

  // 處理單個輸入變更
  const handleInputChange = useCallback((unitName: string, quantity: number) => {
    const newInputValues = inputValues.map(item => 
      item.unitName === unitName ? { ...item, quantity: Math.max(0, quantity) } : item
    );
    
    const totalBaseUnits = calculateTotalBaseUnits(newInputValues);
    
    // 驗證
    if (!allowNegative && totalBaseUnits < 0) {
      setInputError('數量不能為負數');
      return;
    }
    
    if (maxValue && totalBaseUnits > maxValue) {
      setInputError(`數量不能超過 ${maxValue}`);
      return;
    }
    
    setInputError('');
    setInputValues(newInputValues);
    onChange(totalBaseUnits);
  }, [inputValues, calculateTotalBaseUnits, allowNegative, maxValue, onChange]);

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
          p: 2, 
          borderRadius: 2,
          border: error || inputError ? `1px solid ${theme.palette.error.main}` : undefined
        }}
      >
        {/* 簡化輸入模式 */}
        {!showAdvanced && (
          <Box>
            <TextField
              fullWidth
              type="number"
              label={`${label} (${baseUnit?.unitName || '個'})`}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={disabled}
              error={!!(error || inputError)}
              helperText={error || inputError || helperText}
              variant={variant}
              InputProps={{
                endAdornment: showCalculator && (
                  <Tooltip title="切換到高級輸入模式">
                    <IconButton 
                      onClick={() => setShowAdvanced(true)}
                      size="small"
                    >
                      <CalculatorIcon />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
          </Box>
        )}

        {/* 高級輸入模式 */}
        {showAdvanced && (
          <Box>
            {/* 包裝單位輸入 */}
            <Grid container spacing={2}>
              {sortedPackageUnits.map((unit, index) => (
                <Grid item xs={12} sm={6} md={4} key={unit.unitName}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDecrement(unit.unitName)}
                      disabled={disabled}
                    >
                      <RemoveIcon />
                    </IconButton>
                    
                    <TextField
                      size="small"
                      type="number"
                      label={unit.unitName}
                      value={inputValues.find(i => i.unitName === unit.unitName)?.quantity || 0}
                      onChange={(e) => handleInputChange(unit.unitName, parseInt(e.target.value) || 0)}
                      disabled={disabled}
                      sx={{ flexGrow: 1, minWidth: '80px' }}
                      inputProps={{ min: 0 }}
                    />
                    
                    <IconButton
                      size="small"
                      onClick={() => handleIncrement(unit.unitName)}
                      disabled={disabled}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* 操作按鈕 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowAdvanced(false)}
                startIcon={<ExpandLessIcon />}
              >
                簡化模式
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={handleClear}
                startIcon={<ClearIcon />}
                disabled={disabled}
              >
                清空
              </Button>
            </Box>
          </Box>
        )}

        {/* 當前總數顯示 */}
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            當前總數：
          </Typography>
          <Typography variant="h6" color="primary.main" fontWeight="bold">
            {currentTotal.displayText}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            基礎單位：{calculateTotalBaseUnits(inputValues)} {baseUnit?.unitName || '個'}
          </Typography>
        </Box>

        {/* 錯誤提示 */}
        <Collapse in={!!(error || inputError)}>
          <Alert severity="error" sx={{ mt: 1 }}>
            {error || inputError}
          </Alert>
        </Collapse>

        {/* 說明文字 */}
        {helperText && !error && !inputError && (
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
              {quickInputOptions.slice(0, isMobile ? 6 : 12).map((option, index) => (
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