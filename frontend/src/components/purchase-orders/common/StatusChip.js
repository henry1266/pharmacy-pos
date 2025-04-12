import React from 'react';
import { Chip } from '@mui/material';

/**
 * 狀態標籤組件
 * @param {Object} props - 組件屬性
 * @param {string} props.status - 狀態值
 * @param {string} props.size - 標籤大小
 * @returns {React.ReactElement} 狀態標籤組件
 */
const StatusChip = ({ status, size = 'small' }) => {
  let color = 'default';
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
