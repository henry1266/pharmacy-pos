import React from 'react';
import { Tooltip } from '@mui/material';
import { BalanceTooltipProps } from '../../types';
import { formatAmount } from '../../../../utils/transactionUtils';
import { COLORS } from '../../constants';

/**
 * 餘額提示組件
 * 顯示格式化的餘額和總額，並根據餘額狀態顯示不同顏色
 * 在懸停時顯示提示信息
 */
const BalanceTooltip: React.FC<BalanceTooltipProps> = ({ 
  availableAmount, 
  totalAmount, 
  tooltip 
}) => (
  <Tooltip title={tooltip} arrow>
    <span style={{
      fontWeight: 'medium',
      color: availableAmount === totalAmount ? COLORS.SUCCESS :
             availableAmount > 0 ? COLORS.WARNING : COLORS.ERROR
    }}>
      {formatAmount(availableAmount)}/{formatAmount(totalAmount)}
    </span>
  </Tooltip>
);

export default BalanceTooltip;