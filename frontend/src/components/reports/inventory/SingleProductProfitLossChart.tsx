import React, { FC } from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes 進行 props 驗證
import {
  Box,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Line,
  TooltipProps
} from 'recharts';

// 定義交易記錄的型別
interface Transaction {
  type: string;
  quantity: number;
  price: number;
  purchaseOrderNumber: string;
  shippingOrderNumber: string;
  saleNumber: string;
  cumulativeStock?: number;
  cumulativeProfitLoss?: number;
  profitLoss?: number;
  orderNumber?: string;
  index?: number;
}

// 定義圖表數據項目的型別
interface ChartDataItem {
  orderNumber: string;
  index: number;
  type: string;
  quantity: number;
  price: number;
  profitLoss: number;
  cumulativeStock: number;
  cumulativeProfitLoss: number;
  positiveProfitLoss: number;
  negativeProfitLoss: number;
}

// 圖表顏色 (Moved to module scope)
const colors = {
  profit: '#00d97e',  // 綠色 - 正值
  loss: '#e53f3c',    // 紅色 - 負值
  stock: '#624bff'    // 藍色 - 庫存
};

// 格式化金額 (Moved to module scope)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
};

// 自定義Tooltip props 型別
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataItem;
  }>;
  label?: string | number;
}

// 自定義Tooltip (Moved out of SingleProductProfitLossChart)
const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload?.length) {
    const data = payload[0]?.payload;
    
    return (
      <Paper sx={{
        p: 2,
        boxShadow: 'var(--card-shadow)',
        border: '1px solid var(--border-color)',
        bgcolor: 'var(--bg-paper)'
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          貨單號: {data.orderNumber}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          類型: {data.type}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box
            component="span"
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: colors.stock,
              mr: 1
            }}
          />
          <Typography variant="body2">
            累積庫存: {data.cumulativeStock}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box
            component="span"
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: data.cumulativeProfitLoss >= 0 ? colors.profit : colors.loss,
              mr: 1
            }}
          />
          <Typography variant="body2">
            累積損益總和: {formatCurrency(data.cumulativeProfitLoss)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{
          color: data.profitLoss >= 0 ? colors.profit : colors.loss,
          fontWeight: 500
        }}>
          本次交易損益: {formatCurrency(data.profitLoss)}
        </Typography>
      </Paper>
    );
  }
  return null;
};

// 添加 CustomTooltip 的 PropTypes 驗證 (Moved with CustomTooltip)
CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
} as any; // 使用 any 類型來避免 TypeScript 錯誤

// SingleProductProfitLossChart props 型別
interface SingleProductProfitLossChartProps {
  transactions?: Transaction[];
}

const SingleProductProfitLossChart: FC<SingleProductProfitLossChartProps> = ({ transactions = [] }) => {
  // colors and formatCurrency are now in module scope

  // 獲取交易的貨單號
  const getOrderNumber = (transaction: Transaction): string => {
    if (transaction.type === '進貨') {
      return transaction.purchaseOrderNumber || '-';
    } else if (transaction.type === '出貨') {
      return transaction.shippingOrderNumber || '-';
    } else if (transaction.type === '銷售') {
      return transaction.saleNumber || '-';
    }
    return '-';
  };

  // 處理交易數據，獲取累積值
  const getTransactionsWithCumulativeValues = (): ChartDataItem[] => {
    // 防護檢查：確保transactions存在且是數組
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      console.warn('SingleProductProfitLossChart: transactions is undefined, null, or empty');
      return [];
    }
    
    // 按貨單號排序交易記錄（由小到大）
    const sortedTransactions = [...transactions].sort((a, b) => {
      const aOrderNumber = getOrderNumber(a);
      const bOrderNumber = getOrderNumber(b);
      return aOrderNumber.localeCompare(bOrderNumber);
    });
    
    // 計算累積庫存和損益總和
    let cumulativeStock = 0;
    let cumulativeProfitLoss = 0;
    
    return sortedTransactions.map((transaction, index) => {
      // 防護檢查：確保transaction存在且有必要的屬性
      if (!transaction) return null;
      
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
      
      return {
        orderNumber: orderNumber,
        index: index, // 使用索引作為X軸值，而不是貨單號
        type: transaction.type ?? '未知類型',
        quantity: quantity,
        price: price,
        profitLoss: profitLoss,
        cumulativeStock: cumulativeStock,
        cumulativeProfitLoss: cumulativeProfitLoss,
        // 為了區域圖的填充顏色，添加正負值分離
        positiveProfitLoss: cumulativeProfitLoss > 0 ? cumulativeProfitLoss : 0,
        negativeProfitLoss: cumulativeProfitLoss < 0 ? cumulativeProfitLoss : 0
      };
    }).filter((item): item is ChartDataItem => item !== null);
  };

  // 獲取處理後的圖表數據
  const chartData = getTransactionsWithCumulativeValues();

  // CustomTooltip is now defined in module scope

  // 渲染圖表
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            暫無交易記錄數據。
          </Alert>
          <Typography color="var(--text-secondary)">
            此商品沒有交易記錄或數據未正確加載。
          </Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="index" 
            tick={false} // 不顯示刻度文字
            tickLine={false} // 不顯示刻度線
            axisLine={true} // 顯示軸線
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
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#000" yAxisId="left" />
          <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.profit} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={colors.profit} stopOpacity={0.2}/>
            </linearGradient>
            <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.loss} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={colors.loss} stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="positiveProfitLoss" 
            name="盈利" 
            stroke={colors.profit} 
            fillOpacity={1}
            fill="url(#colorProfit)"
          />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="negativeProfitLoss" 
            name="虧損" 
            stroke={colors.loss} 
            fillOpacity={1}
            fill="url(#colorLoss)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativeStock"
            name="庫存"
            stroke={colors.stock}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight="600" color="var(--text-primary)" sx={{ mb: 1 }}>
        盈虧分析圖表
      </Typography>
      
      {renderChart()}
    </Box>
  );
};

// 添加 SingleProductProfitLossChart 的 PropTypes 驗證
SingleProductProfitLossChart.propTypes = {
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
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default SingleProductProfitLossChart;