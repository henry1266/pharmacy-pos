import React from 'react';
import { Chip } from '@mui/material';

/**
 * 交易狀態標籤組件
 * @param props 組件屬性
 * @returns 狀態標籤組件
 */
interface StatusChipProps {
  status: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  switch (status) {
    case 'confirmed':
      return <Chip label="已確認" color="success" size="small" />;
    case 'draft':
      return <Chip label="草稿" color="warning" size="small" />;
    case 'cancelled':
      return <Chip label="已取消" color="error" size="small" />;
    default:
      return <Chip label="未知" color="default" size="small" />;
  }
};

export default StatusChip;