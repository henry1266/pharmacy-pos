import React from 'react';
import { Tooltip } from '@mui/material';
import { AmountTooltipProps } from '../../types';
import { formatAmount } from '../../../../utils/transactionUtils';

/**
 * 金額提示組件
 * 顯示格式化的金額，並在懸停時顯示提示信息
 */
const AmountTooltip: React.FC<AmountTooltipProps> = ({ amount, tooltip }) => (
  <Tooltip title={tooltip} arrow>
    <span style={{ fontWeight: 'medium' }}>
      {formatAmount(amount)}
    </span>
  </Tooltip>
);

export default AmountTooltip;