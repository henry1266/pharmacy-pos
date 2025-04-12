import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Box
} from '@mui/material';

/**
 * 狀態選擇組件
 * @param {Object} props - 組件屬性
 * @param {string} props.value - 當前狀態值
 * @param {Function} props.onChange - 狀態變更處理函數
 * @returns {React.ReactElement} 狀態選擇組件
 */
const StatusSelect = ({
  value,
  onChange
}) => {
  return (
    <Box
      sx={{
        backgroundColor:
          value === 'pending' ? '#FFF3CD' : // 黃色（Bootstrap 較淡的警告色）
          value === 'completed' ? '#D4EDDA' : 'transparent', // 綠色（Bootstrap 較淡的成功色）
      }}
    >
      <FormControl fullWidth>
        <InputLabel>狀態</InputLabel>
        <Select
          name="status"
          value={value}
          onChange={onChange}
          label="狀態"
          onKeyDown={(event) => {
            if (event.key === 'Tab') {
              event.preventDefault();
              // 跳轉到藥品選擇欄位
              setTimeout(() => {
                try {
                  // 嘗試方法1：使用ID選擇器
                  const productSelect = document.getElementById('product-select-input');
                  if (productSelect) {
                    productSelect.focus();
                    return;
                  }
                  
                  // 嘗試方法2：使用更通用的選擇器
                  const productInput = document.querySelector('#product-select input');
                  if (productInput) {
                    productInput.focus();
                    return;
                  }
                  
                  // 嘗試方法3：直接點擊藥品選擇欄位
                  const productSelectElement = document.getElementById('product-select');
                  if (productSelectElement) {
                    productSelectElement.click();
                  }
                } catch (error) {
                  console.error('無法自動聚焦到藥品選擇欄位:', error);
                }
              }, 100);
            }
          }}
        >
          <MenuItem value="pending">處理中</MenuItem>
          <MenuItem value="completed">已完成</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default StatusSelect;
