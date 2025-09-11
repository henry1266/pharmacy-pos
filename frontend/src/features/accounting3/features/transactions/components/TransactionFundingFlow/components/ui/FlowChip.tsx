import React from 'react';
import { Chip } from '@mui/material';
import { FlowChipProps } from '../../types';
import { CHIP_STYLES } from '../../constants';

/**
 * 流向 Chip 組件
 * 用於顯示帳戶名稱，支持點擊導航到帳戶詳情
 */
const FlowChip: React.FC<FlowChipProps> = ({
  label,
  color,
  margin = '0',
  accountId,
  handleAccountClick
}) => (
  <Chip
    label={label}
    size="small"
    color={color}
    clickable={!!accountId}
    onClick={accountId && handleAccountClick ? () => handleAccountClick(accountId) : undefined}
    sx={{
      ...CHIP_STYLES,
      margin,
      cursor: accountId ? 'pointer' : 'default',
      '&:hover': accountId ? {
        backgroundColor: color === 'primary' ? 'primary.dark' : 'secondary.dark'
      } : {}
    }}
  />
);

export default FlowChip;