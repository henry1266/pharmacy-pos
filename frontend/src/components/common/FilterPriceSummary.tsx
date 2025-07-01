import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { CalculateOutlined } from '@mui/icons-material';

/**
 * 篩選行介面
 */
interface FilteredRow {
  [key: string]: any;
}

/**
 * 通用篩選價格加總元件
 * 用於在purchase-orders和shipping-orders篩選後顯示總金額和毛利
 */
interface FilterPriceSummaryProps {
  filteredRows?: FilteredRow[];
  totalAmountField?: string;
  totalProfitField?: string;
  title?: string;
  showProfit?: boolean;
  onCalculateProfit?: (ids: string[]) => Promise<number>;
}

const FilterPriceSummary: React.FC<FilterPriceSummaryProps> = ({
  filteredRows = [],
  totalAmountField = 'totalAmount',
  totalProfitField = 'totalProfit',
  title = '篩選結果',
  showProfit = false,
  onCalculateProfit
}) => {
  const [calculatingProfit, setCalculatingProfit] = useState(false);
  const [calculatedProfit, setCalculatedProfit] = useState<number | null>(null);
  
  // 計算篩選後的總金額和總毛利
  const { totalFilteredAmount, totalFilteredProfit } = useMemo(() => {
    if (!filteredRows || filteredRows.length === 0) {
      return { totalFilteredAmount: 0, totalFilteredProfit: 0 };
    }
    
    return filteredRows.reduce((acc, row) => {
      const amount = row[totalAmountField] ?? 0;
      const profit = showProfit ? (row[totalProfitField] ?? 0) : 0;
      
      return {
        totalFilteredAmount: acc.totalFilteredAmount + amount,
        totalFilteredProfit: acc.totalFilteredProfit + profit
      };
    }, { totalFilteredAmount: 0, totalFilteredProfit: 0 });
  }, [filteredRows, totalAmountField, totalProfitField, showProfit]);
  
  // 處理計算毛利按鈕點擊
  const handleCalculateProfit = async () => {
    if (!onCalculateProfit || filteredRows.length === 0) return;
    
    try {
      setCalculatingProfit(true);
      // 獲取所有出貨單ID
      const ids = filteredRows.map(row => row._id);
      // 調用計算毛利函數
      const profit = await onCalculateProfit(ids);
      setCalculatedProfit(profit);
    } catch (error) {
      console.error('計算毛利失敗:', error);
    } finally {
      setCalculatingProfit(false);
    }
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 0, sm: 3 }, mb: { xs: 1, sm: 0 } }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>
                  總金額：
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {totalFilteredAmount.toLocaleString()} 元
                </Typography>
              </Box>
              
              {showProfit && calculatedProfit !== null && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ mr: 1 }}>
                    總毛利：
                  </Typography>
                  <Typography
                    variant="h6"
                    color={calculatedProfit >= 0 ? "success.main" : "error.main"}
                    fontWeight="bold"
                  >
                    {calculatedProfit.toLocaleString()} 元
                  </Typography>
                </Box>
              )}
            </Box>
            
            {showProfit && onCalculateProfit && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={calculatingProfit ? <CircularProgress size={16} /> : <CalculateOutlined />}
                onClick={handleCalculateProfit}
                disabled={calculatingProfit || filteredRows.length === 0}
                sx={{ mt: { xs: 1, sm: 0 } }}
              >
                {calculatingProfit ? '計算中...' : '計算毛利'}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FilterPriceSummary;