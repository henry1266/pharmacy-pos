import React, { FC, useState, ChangeEvent } from 'react';
import {
  TextField,
  Box,
  Typography,
  Chip,
  Grid
} from '@mui/material';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import { Product } from '@pharmacy-pos/shared/types/entities';

interface QuantityInputProps {
  value: string;
  onChange: (event: { target: { name: string; value: string } }) => void;
  selectedProduct: Product | null;
  disabled?: boolean;
  onFocus?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

/**
 * 數量輸入組件
 * 支持基礎單位和大包裝單位的輸入模式切換
 */
const QuantityInput: FC<QuantityInputProps> = ({
  value,
  onChange,
  selectedProduct,
  disabled = false,
  onFocus
}) => {
  // 添加狀態來跟踪當前的輸入模式（基礎單位或大包裝單位）
  const [inputMode, setInputMode] = useState<'base' | 'package'>('base');
  
  // 添加狀態來存儲實際的總數量（基礎單位的數量）和顯示的數量
  const [actualTotalQuantity, setActualTotalQuantity] = useState<number>(0);
  const [displayInputQuantity, setDisplayInputQuantity] = useState<string>(value);

  /**
   * 處理主要數量輸入變更
   * 根據當前輸入模式計算實際總數量並更新相關狀態
   */
  const handleMainQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // 更新顯示的輸入數量
    setDisplayInputQuantity(value);
    
    // 計算實際的總數量（基礎單位）
    let actualQuantity = 0;
    const numericValue = Number(value) || 0;
    
    if (inputMode === 'base' || !selectedProduct?.packageUnits?.length) {
      // 基礎單位模式，直接使用輸入的數量
      actualQuantity = numericValue;
    } else {
      // 大包裝單位模式，將輸入的數量乘以大包裝單位的數量
      const largestPackageUnit = [...(selectedProduct.packageUnits as ProductPackageUnit[])]
        .sort((a, b) => b.unitValue - a.unitValue)[0];
      
      actualQuantity = numericValue * largestPackageUnit.unitValue;
      
      // 更新 packageQuantity
      onChange({
        target: { name: 'packageQuantity', value: numericValue.toString() }
      });
      
      // 如果有第二大的包裝單位，則更新 boxQuantity
      if ((selectedProduct.packageUnits as ProductPackageUnit[]).length > 1) {
        const remainingPackages = (selectedProduct.packageUnits as ProductPackageUnit[])
          .filter(p => p.unitName !== largestPackageUnit.unitName);
        
        const secondLargest = remainingPackages.reduce(
          (max, current) => current.unitValue > max.unitValue ? current : max,
          remainingPackages[0]
        );
        
        // 計算第二大包裝單位的數量
        const boxQuantity = Math.floor(actualQuantity / secondLargest.unitValue);
        onChange({
          target: { name: 'boxQuantity', value: boxQuantity.toString() }
        });
      }
    }
    
    // 更新實際的總數量和表單數據
    setActualTotalQuantity(actualQuantity);
    onChange({
      target: { name: 'dquantity', value: actualQuantity.toString() }
    });
  };

  /**
   * 處理數量輸入框的按鍵事件
   * 在按下 Enter 鍵時切換基礎單位和大包裝單位輸入模式
   */
  const handleQuantityKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // 只有在有選中產品且產品有包裝單位時才切換
      const hasPackageUnits = selectedProduct?.packageUnits && (selectedProduct.packageUnits as ProductPackageUnit[]).length > 0;
      
      if (hasPackageUnits) {
        // 切換輸入模式（基礎單位 <-> 大包裝單位）
        setInputMode(inputMode === 'base' ? 'package' : 'base');
        
        // 清空輸入框
        setDisplayInputQuantity('');
      }
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        label={inputMode === 'base' ? "總數量" : "大包裝數量"}
        name="dquantity"
        type="number"
        value={displayInputQuantity}
        onChange={handleMainQuantityChange}
        {...(onFocus ? { onFocus } : {})}
        onKeyDown={handleQuantityKeyDown}
        inputProps={{ min: "0", step: "1" }}
        disabled={disabled}
        size="small"
        sx={{
          '& .MuiInputLabel-root': {
            color: inputMode === 'package' ? 'primary.main' : 'inherit',
            fontWeight: inputMode === 'package' ? 'bold' : 'normal',
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: inputMode === 'package' ? 'primary.main' : 'inherit',
              borderWidth: inputMode === 'package' ? 2 : 1,
            },
          },
        }}
      />
      
      {/* 基礎單位總數顯示 */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        mt: 0.5,
        px: 0.5
      }}>
        <Typography variant="caption" color="text.secondary">
          基礎單位總數: <strong>{actualTotalQuantity}</strong>
        </Typography>
      </Box>

      {/* 大包裝提示 */}
      {selectedProduct?.packageUnits && (selectedProduct.packageUnits as ProductPackageUnit[]).length > 0 && (
        <Grid item xs={12}>
          <Box sx={{
            p: 1,
            mt: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(selectedProduct.packageUnits as ProductPackageUnit[]).map((unit, index) => (
                <Chip
                  key={index}
                  label={`${unit.unitName}: ${unit.unitValue} ${selectedProduct.unit}`}
                  size="small"
                  variant="outlined"
                  color={inputMode === 'package' && index === 0 ? "primary" : "default"}
                />
              ))}
            </Box>
          </Box>
        </Grid>
      )}
    </Box>
  );
};

export default QuantityInput;