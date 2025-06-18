import React from 'react';
import { 
  TableRow,
  TableCell,
  Typography
} from '@mui/material';

/**
 * 通用價格加總元件
 * 用於在purchase-orders和shipping-orders表格底部顯示總金額
 */
interface PriceSummaryProps {
  totalAmount: number;
  colSpan?: number;
  totalColumns?: number;
}

const PriceSummary: React.FC<PriceSummaryProps> = ({
  totalAmount,
  colSpan = 3,
  totalColumns = 7
}) => {
  // 計算剩餘的列數
  const remainingCols = totalColumns - colSpan - 2;
  
  return (
    <TableRow
      sx={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 5,
        borderTop: '2px solid #e0e0e0',
        '& > *': { fontWeight: 'bold' }
      }}
    >
      <TableCell></TableCell>
      <TableCell colSpan={colSpan} align="right">
        <Typography variant="subtitle1">總計：</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="subtitle1">{totalAmount.toLocaleString()}</Typography>
      </TableCell>
      <TableCell colSpan={remainingCols}></TableCell>
    </TableRow>
  );
};

export default PriceSummary;