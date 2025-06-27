import React from 'react';
import { Chip, ChipProps } from '@mui/material';

/**
 * 出貨單付款狀態標籤組件 - 整合系統色彩
 */
type PaymentStatusType = '未付' | '未收' | '已收款' | '已下收' | '已匯款' | '已開立' | 'paid' | 'unpaid';

interface PaymentStatusChipProps {
  status?: PaymentStatusType | string;
}

const PaymentStatusChip: React.FC<PaymentStatusChipProps> = ({ status = '未收' }) => {
  let chipProps: Partial<ChipProps> = { color: 'default' };
  let label = status ?? '未收';
  
  switch (status) {
    case '未付':
    case 'unpaid':
      label = '未付款';
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
    case '未收':
      label = '未收款';
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
    case '已收款':
    case 'paid':
      label = '已付款';
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
    case '已下收':
      label = '已下收';
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
    case '已匯款':
      label = '已匯款';
      chipProps = {
        sx: {
          backgroundColor: '#d1f2eb',
          color: '#0e6b47',
          border: '1px solid #a3e4d7',
          fontWeight: 600,
          '& .MuiChip-label': {
            fontWeight: 600
          }
        }
      };
      break;
    case '已開立':
      label = '已開立';
      chipProps = {
        sx: {
          backgroundColor: '#e2e3f1',
          color: '#4c4f69',
          border: '1px solid #c5c7db',
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
  
  return <Chip size="small" label={label} {...chipProps} />;
};

export default PaymentStatusChip;