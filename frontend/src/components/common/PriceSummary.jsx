import React from 'react';
import { 
  TableRow,
  TableCell,
  Typography
} from '@mui/material';
import PropTypes from 'prop-types';

/**
 * 通用價格加總元件
 * 用於在purchase-orders和shipping-orders表格底部顯示總金額
 * 
 * @param {Object} props - 組件屬性
 * @param {number} props.totalAmount - 總金額
 * @param {number} props.colSpan - 總計標籤佔據的列數 (默認為3)
 * @param {number} props.totalColumns - 表格總列數 (默認為7)
 * @returns {React.ReactElement} 價格加總行元件
 */
const PriceSummary = ({
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

// 添加 Props 驗證
PriceSummary.propTypes = {
  totalAmount: PropTypes.number.isRequired,
  colSpan: PropTypes.number,
  totalColumns: PropTypes.number
};

// 預設值
PriceSummary.defaultProps = {
  colSpan: 3,
  totalColumns: 7
};

export default PriceSummary;
