import React from 'react';
import { Chip, ChipProps } from '@mui/material';

/**
 * 狀態標籤組件
 */
type StatusType = string;

interface StatusChipProps {
  status: StatusType;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  let color: ChipProps['color'] = 'default';
  let label = '未知';
  
  switch (status) {
    case 'pending':
      color = 'warning';
      label = '處理中';
      break;
    case 'completed':
      color = 'success';
      label = '已完成';
      break;
    case 'cancelled':
      color = 'error';
      label = '已取消';
      break;
    default:
      break;
  }
  
  return <Chip size={size} color={color} label={label} />;
};

export default StatusChip;