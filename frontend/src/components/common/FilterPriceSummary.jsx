import React, { useMemo } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography
} from '@mui/material';
import PropTypes from 'prop-types';

/**
 * 通用篩選價格加總元件
 * 用於在purchase-orders和shipping-orders篩選後顯示總金額
 * 
 * @param {Object} props - 組件屬性
 * @param {Array} props.filteredRows - 篩選後的數據行
 * @param {string} props.totalAmountField - 總金額字段名稱 (默認為'totalAmount')
 * @param {string} props.title - 標題 (默認為'篩選結果')
 * @returns {React.ReactElement} 篩選價格加總元件
 */
const FilterPriceSummary = ({
  filteredRows = [],
  totalAmountField = 'totalAmount',
  title = '篩選結果'
}) => {
  // 計算篩選後的總金額
  const totalFilteredAmount = useMemo(() => {
    if (!filteredRows || filteredRows.length === 0) return 0;
    
    return filteredRows.reduce((sum, row) => {
      const amount = row[totalAmountField] || 0;
      return sum + amount;
    }, 0);
  }, [filteredRows, totalAmountField]);

  // 如果沒有篩選結果，不顯示元件
  if (filteredRows.length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 2, mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">
            {title}（共 {filteredRows.length} 筆）
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ mr: 1 }}>
              總金額：
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {totalFilteredAmount.toLocaleString()} 元
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// 添加 Props 驗證
FilterPriceSummary.propTypes = {
  filteredRows: PropTypes.array,
  totalAmountField: PropTypes.string,
  title: PropTypes.string
};

// 預設值
FilterPriceSummary.defaultProps = {
  filteredRows: [],
  totalAmountField: 'totalAmount',
  title: '篩選結果'
};

export default FilterPriceSummary;
