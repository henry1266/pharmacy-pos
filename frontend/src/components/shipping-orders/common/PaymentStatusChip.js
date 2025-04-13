import React from 'react';
import { Chip } from '@mui/material';

/**
 * 出貨單付款狀態標籤組件
 * @param {Object} props - 組件屬性
 * @param {string} props.status - 付款狀態值
 * @returns {React.ReactElement} 付款狀態標籤組件
 */
const PaymentStatusChip = ({ status }) => {
  let color = 'default';
  let label = status || '未收';
  
  switch (status) {
    case '未收':
      color = 'warning';
      break;
    case '已收款':
      color = 'info';
      break;
    case '已開立':
      color = 'success';
      break;
    default:
      break;
  }
  
  return <Chip size="small" color={color} label={label} />;
};

export default PaymentStatusChip;
