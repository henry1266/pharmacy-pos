import React from 'react';
import { Chip, ChipProps } from '@mui/material';

/**
 * 出貨單付款狀態標籤組件
 */
type PaymentStatusType = '未付' | '未收' | '已收款' | '已下收' | '已匯款' | '已開立' | string;

interface PaymentStatusChipProps {
  status?: PaymentStatusType;
}

const PaymentStatusChip: React.FC<PaymentStatusChipProps> = ({ status = '未收' }) => {
  let color: ChipProps['color'] = 'default';
  let label = status || '未收';
  
  switch (status) {
    case '未付':
      color = 'warning';
      break;
    case '未收':
      color = 'warning';
      break;
    case '已收款':
      color = 'info';
      break;
    case '已下收':
      color = 'info';
      break;
    case '已匯款':
      color = 'success';
      break;
    case '已開立':
      color = 'success';
      break;
    default:
      // 預設情況已在初始化時處理
      break;
  }
  
  return <Chip size="small" color={color} label={label} />;
};

export default PaymentStatusChip;