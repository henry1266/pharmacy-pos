import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Box,
  SelectChangeEvent
} from '@mui/material';

/**
 * 狀態選擇組件
 */
interface StatusSelectProps {
  value: string;
  onChange: (event: SelectChangeEvent) => void;
}

const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange
}) => {
  // 提取巢狀三元運算子為獨立變數
  let backgroundColor = 'transparent';
  if (value === 'pending') {
    backgroundColor = '#FFF3CD'; // 黃色（Bootstrap 較淡的警告色）
  } else if (value === 'completed') {
    backgroundColor = '#D4EDDA'; // 綠色（Bootstrap 較淡的成功色）
  }

  return (
    <Box
      sx={{
        backgroundColor: backgroundColor
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
                  if (productInput && productInput instanceof HTMLElement) {
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