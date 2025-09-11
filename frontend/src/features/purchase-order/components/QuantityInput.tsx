import React, { FC, useState, useEffect, ChangeEvent } from 'react';
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
  onQuantityChange?: (displayValue: string, actualValue: number) => void;
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
  onFocus,
  onQuantityChange
}) => {
  // 添加狀態來跟踪當前的輸入模式（基礎單位或大包裝單位）
  const [inputMode, setInputMode] = useState<'base' | 'package'>('base');

  // 添加狀態來存儲實際的總數量（基礎單位的數量）和顯示的數量
  const [actualTotalQuantity, setActualTotalQuantity] = useState<number>(0);
  const [displayInputQuantity, setDisplayInputQuantity] = useState<string>('');

  // 處理外部value變化
  useEffect(() => {
    if (value === '') {
      // 當外部value為空時，總是清空顯示值
      setDisplayInputQuantity('');
      setActualTotalQuantity(0);
      setInputMode('base');
    } else if (displayInputQuantity === '' && value !== displayInputQuantity) {
      // 只有在顯示值為空且外部值不同時才設置初始值
      setDisplayInputQuantity(value);
    }
  }, [value]);

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

      // 在基礎單位模式下，將 packageQuantity 和 boxQuantity 設置為 0
      onChange({
        target: { name: 'packageQuantity', value: '0' }
      });

      onChange({
        target: { name: 'boxQuantity', value: '0' }
      });
    } else {
      // 大包裝單位模式，將輸入的數量乘以大包裝單位的數量
      const largestPackageUnit = [...(selectedProduct.packageUnits as ProductPackageUnit[])]
        .sort((a, b) => b.unitValue - a.unitValue)[0];

      if (largestPackageUnit) {
        actualQuantity = numericValue * largestPackageUnit.unitValue;

        // 更新 packageQuantity 為輸入的大包裝數量
        onChange({
          target: { name: 'packageQuantity', value: numericValue.toString() }
        });

        // 更新 boxQuantity 為實際總數量（基礎單位）
        onChange({
          target: { name: 'boxQuantity', value: actualQuantity.toString() }
        });
      }
    }

    // 更新實際的總數量和表單數據
    setActualTotalQuantity(actualQuantity);
    onChange({
      target: { name: 'dquantity', value: actualQuantity.toString() }
    });

    // 通知父組件數量變化
    if (onQuantityChange) {
      onQuantityChange(value, actualQuantity);
    }
  };

  /**
   * 處理數量輸入框失去焦點事件
   * 確保數據正確更新到父組件
   */
  const handleQuantityBlur = () => {
    // 確保數據已經更新到父組件
    const numericValue = Number(displayInputQuantity) || 0;
    let actualQuantity = 0;

    if (inputMode === 'base' || !selectedProduct?.packageUnits?.length) {
      actualQuantity = numericValue;
    } else {
      const largestPackageUnit = [...(selectedProduct.packageUnits as ProductPackageUnit[])]
        .sort((a, b) => b.unitValue - a.unitValue)[0];
      actualQuantity = numericValue * largestPackageUnit.unitValue;
    }

    // 立即更新父組件狀態
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
        const newInputMode = inputMode === 'base' ? 'package' : 'base';
        setInputMode(newInputMode);

        // 清空輸入框並重置相關狀態
        setDisplayInputQuantity('');
        setActualTotalQuantity(0);

        // 如果切換回基礎單位模式，清空相關字段
        if (newInputMode === 'base') {
          onChange({
            target: { name: 'dquantity', value: '' }
          });
          onChange({
            target: { name: 'packageQuantity', value: '' }
          });
          onChange({
            target: { name: 'boxQuantity', value: '' }
          });
        }
      }
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            label={inputMode === 'base' ? "總數量" : "大包裝數量"}
            name="dquantity"
            type="number"
            value={displayInputQuantity}
            onChange={handleMainQuantityChange}
            onBlur={handleQuantityBlur}
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
              單位總數: <strong>{actualTotalQuantity}</strong>
            </Typography>
          </Box>
        </Box>

        {/* 大包裝提示 - 顯示在右側 */}
        {selectedProduct?.packageUnits && (selectedProduct.packageUnits as ProductPackageUnit[]).length > 0 && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 0.5,
            mt: 0.5
          }}>
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
        )}
      </Box>
    </Box>
  );
};

export default QuantityInput;