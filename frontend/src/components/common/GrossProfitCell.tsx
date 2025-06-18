import React from 'react';
import { TableCell } from '@mui/material';

/**
 * FIFO 毛利介面
 */
interface FifoProfit {
  grossProfit?: number;
  // Potentially other properties like totalCost, profitMargin if needed in the future
}

/**
 * 毛利單元格組件
 */
interface GrossProfitCellProps {
  fifoProfit?: FifoProfit | null;
}

const GrossProfitCell: React.FC<GrossProfitCellProps> = ({ fifoProfit }) => {
  const grossProfitValue = fifoProfit?.grossProfit;
  const textColor = grossProfitValue !== undefined && grossProfitValue >= 0 ? 'success.main' : 'error.main';

  return (
    <TableCell align="right" sx={{ color: textColor }}>
      {grossProfitValue !== undefined ? grossProfitValue.toFixed(2) : 'N/A'}
    </TableCell>
  );
};

export default GrossProfitCell;