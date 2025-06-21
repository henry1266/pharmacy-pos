import React, { FC } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  GroupedProduct,
  ChartDataItem
} from './shared/types';
import {
  formatCurrency,
  getOrderNumber
} from './shared/utils';
import {
  CHART_COLORS,
  CHART_MARGINS,
  CHART_HEIGHT
} from './shared/constants';
import { ChartCustomTooltip } from './shared/components';
import { useChartType } from './shared/hooks';

// InventoryProfitLossChart props 型別
interface InventoryProfitLossChartProps {
  groupedData?: GroupedProduct[];
}

const InventoryProfitLossChart: FC<InventoryProfitLossChartProps> = ({ groupedData = [] }) => {
  const { chartType, handleChartTypeChange } = useChartType('area');

  // 處理交易數據，獲取所有產品的交易記錄
  const getAllTransactionsWithCumulativeValues = (): ChartDataItem[] => {
    const allTransactions: ChartDataItem[] = [];
    
    // 使用可選鏈運算符替代條件判斷
    if (!groupedData?.length) {
      console.warn('InventoryProfitLossChart: groupedData is undefined, null, or empty');
      return allTransactions;
    }
    
    // 遍歷所有產品
    groupedData.forEach(product => {
      // 使用可選鏈運算符替代條件判斷
      if (!product?.transactions?.length) {
        return;
      }
      
      // 按貨單號排序交易記錄（由小到大）
      const sortedTransactions = [...product.transactions].sort((a, b) => {
        const aOrderNumber = getOrderNumber(a);
        const bOrderNumber = getOrderNumber(b);
        return aOrderNumber.localeCompare(bOrderNumber);
      });
      
      // 計算累積庫存和損益總和
      let cumulativeStock = 0;
      let cumulativeProfitLoss = 0;
      
      sortedTransactions.forEach(transaction => {
        // 使用可選鏈運算符替代條件判斷
        if (!transaction) return;
        
        // 計算庫存變化
        const quantity = transaction.quantity ?? 0;
        cumulativeStock += quantity;
        
        // 計算損益變化
        let profitLoss = 0;
        const price = transaction.price ?? 0;
        
        if (transaction.type === '進貨') {
          profitLoss = -(quantity * price);
        } else if (transaction.type === '銷售' || transaction.type === '出貨') {
          profitLoss = quantity * price;
        }
        
        if (transaction.type === '進貨') {
          cumulativeProfitLoss += profitLoss;
        } else if (transaction.type === '銷售' || transaction.type === '出貨') {
          cumulativeProfitLoss -= profitLoss;
        }
        
        // 獲取貨單號
        const orderNumber = getOrderNumber(transaction);
        
        allTransactions.push({
          productId: product.productId ?? '',
          productName: product.productName ?? '未知商品',
          productCode: product.productCode ?? '未知編碼',
          orderNumber: orderNumber,
          type: transaction.type ?? '未知類型',
          quantity: quantity,
          price: price,
          profitLoss: profitLoss,
          cumulativeStock: cumulativeStock,
          cumulativeProfitLoss: cumulativeProfitLoss,
          // 為了區域圖的填充顏色，添加正負值分離
          positiveProfitLoss: cumulativeProfitLoss > 0 ? cumulativeProfitLoss : 0,
          negativeProfitLoss: cumulativeProfitLoss < 0 ? cumulativeProfitLoss : 0
        });
      });
    });
    
    // 按貨單號排序所有交易（由小到大）
    return allTransactions.sort((a, b) => {
      return a.orderNumber.localeCompare(b.orderNumber);
    });
  };

  // 獲取處理後的圖表數據
  const chartData = getAllTransactionsWithCumulativeValues();

  // 渲染圖表
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            暫無數據或數據未正確傳遞。請確保已選擇商品並有交易記錄。
          </Alert>
          <Typography color="var(--text-secondary)">
            此圖表需要從InventoryTable獲取數據，請確保InventoryTable已正確加載。
          </Typography>
        </Box>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart
            data={chartData}
            margin={CHART_MARGINS}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="orderNumber"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<ChartCustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" yAxisId="left" />
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.profit} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.profit} stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.loss} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.loss} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="positiveProfitLoss"
              name="盈利"
              stroke={CHART_COLORS.profit}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="negativeProfitLoss"
              name="虧損"
              stroke={CHART_COLORS.loss}
              fillOpacity={1}
              fill="url(#colorLoss)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativeStock"
              name="庫存"
              stroke={CHART_COLORS.stock}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart
            data={chartData}
            margin={CHART_MARGINS}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="orderNumber"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<ChartCustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" yAxisId="left" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cumulativeProfitLoss"
              name="累積損益總和"
              stroke={CHART_COLORS.profit}
              activeDot={{ r: 8 }}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativeStock"
              name="庫存"
              stroke={CHART_COLORS.stock}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card sx={{ 
      borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--card-shadow)',
      mb: 4
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="600" color="var(--text-primary)">
            庫存盈虧分析（基於損益總和）
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="chart-type-label">圖表類型</InputLabel>
            <Select
              labelId="chart-type-label"
              id="chart-type-select"
              value={chartType}
              label="圖表類型"
              onChange={handleChartTypeChange}
            >
              <MenuItem value="area">區域圖</MenuItem>
              <MenuItem value="line">折線圖</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {renderChart()}
      </CardContent>
    </Card>
  );
};

// PropTypes 驗證
InventoryProfitLossChart.propTypes = {
  groupedData: PropTypes.arrayOf(
    PropTypes.shape({
      productId: PropTypes.string,
      productName: PropTypes.string,
      productCode: PropTypes.string,
      transactions: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string,
          quantity: PropTypes.number,
          price: PropTypes.number,
          purchaseOrderNumber: PropTypes.string,
          shippingOrderNumber: PropTypes.string,
          saleNumber: PropTypes.string
        })
      )
    })
  )
} as any;

export default InventoryProfitLossChart;