import React from 'react';
import { Chip, ChipProps } from '@mui/material';

/**
 * 狀態標籤組件 - 整合系統色彩
 */
interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  let chipProps: Partial<ChipProps> = { color: 'default' };
  let label = '未知';
  
  switch (status) {
    case 'pending':
      label = '待處理';
      chipProps = {
        sx: {
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeaa7',
          fontWeight: 600,
          '& .MuiChip-label': {
            fontWeight: 600
          }
        }
      };
      break;
    case 'completed':
    case 'shipped':
      label = status === 'shipped' ? '已出貨' : '已完成';
      chipProps = {
        sx: {
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          fontWeight: 600,
          '& .MuiChip-label': {
            fontWeight: 600
          }
        }
      };
      break;
    case 'cancelled':
      label = '已取消';
      chipProps = {
        sx: {
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          fontWeight: 600,
          '& .MuiChip-label': {
            fontWeight: 600
          }
        }
      };
      break;
    case 'processing':
      label = '處理中';
      chipProps = {
        sx: {
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          border: '1px solid #bee5eb',
          fontWeight: 600,
          '& .MuiChip-label': {
            fontWeight: 600
          }
        }
      };
      break;
    default:
      chipProps = {
        sx: {
          backgroundColor: '#e2e3e5',
          color: '#383d41',
          border: '1px solid #d6d8db',
          fontWeight: 500
        }
      };
      break;
  }
  
  return <Chip size={size} label={label} {...chipProps} />;
};

export default StatusChip;