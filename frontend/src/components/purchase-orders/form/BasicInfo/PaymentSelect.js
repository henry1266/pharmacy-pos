import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Box
} from '@mui/material';

/**
 * 付款狀態選擇組件
 * @param {Object} props - 組件屬性
 * @param {string} props.value - 當前付款狀態值
 * @param {Function} props.onChange - 付款狀態變更處理函數
 * @returns {React.ReactElement} 付款狀態選擇組件
 */
const PaymentSelect = ({
  value,
  onChange
}) => {
  return (
    <Box
      sx={{
        backgroundColor:
          value === '未付' ? '#F8D7DA' :     // 紅色（淡）
          value === '已下收' ? '#D4EDDA' :    // 綠色（淡）
          value === '已匯款' ? '#D4EDDA' :    // 綠色（淡）
          'transparent',
      }}
    >
      <FormControl fullWidth>
        <InputLabel id="payment-status-label">付款狀態</InputLabel>
        <Select
          labelId="payment-status-label"
          name="paymentStatus"
          value={value}
          onChange={onChange}
          label="付款狀態"
        >
          <MenuItem value="未付">未付</MenuItem>
          <MenuItem value="已下收">已下收</MenuItem>
          <MenuItem value="已匯款">已匯款</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default PaymentSelect;
