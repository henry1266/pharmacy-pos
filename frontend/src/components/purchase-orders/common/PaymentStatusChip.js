import React from 'react';
import { Chip } from '@mui/material';

/**
 * 付款狀態標籤組件
 * @param {Object} props - 組件屬性
 * @param {string} props.status - 付款狀態值
 * @param {string} props.size - 標籤大小
 * @returns {React.ReactElement} 付款狀態標籤組件
 */
const PaymentStatusChip = ({ status, size = 'small' }) => {
  let color = 'default';
  let label = status || '未付';
  
  switch (status) {
    case '未付':
      color = 'warning';
      break;
    case '已下收':
      color = 'info';
      break;
    case '已匯款':
      color = 'success';
      break;
    default:
      break;
  }
  
  return <Chip size={size} color={color} label={label} />;
};

export default PaymentStatusChip;
