import React, { FC } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// 定義交易記錄的型別
interface Transaction {
  type: string;
  quantity: number;
  price: number;
  purchaseOrderNumber: string;
  shippingOrderNumber: string;
  saleNumber: string;
  cumulativeStock: number;
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
  cumulativeStock: number;
  inQuantity: number;  // 進貨量（正值）
  outQuantity: number; // 出貨量（負值）
}

// 圖表顏色
const colors = {
  stock: '#1976d2',     // 藍色 - 庫存折線
  inflow: '#2e7d32',    // 綠色 - 進貨長條
  outflow: '#d32f2f',   // 紅色 - 出貨長條
  highlight: '#ff9800'  // 橙色 - 高亮顏色
};

// 格式化數量
const formatQuantity = (quantity: number): string => {
  return quantity.toString();
};

// 自定義Tooltip props 型別
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataItem;
    dataKey: string;
    value: number;
  }>;
  label?: string | number;
}

// 自定義Tooltip
const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload, label: _label }) => {
  if (active && payload?.length) {
    const data = payload[0]?.payload;
    
    if (!data) return null;
    
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
            庫存數量: {data.cumulativeStock}
          </Typography>
        </Box>
        {data.inQuantity > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box
              component="span"
              sx={{
                width: 12,
                height: 12,
                bgcolor: colors.inflow,
                mr: 1
              }}
            />
            <Typography variant="body2">
              進貨量: +{data.inQuantity}
            </Typography>
          </Box>
        )}
        {data.outQuantity < 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box
              component="span"
              sx={{
                width: 12,
                height: 12,
                bgcolor: colors.outflow,
                mr: 1
              }}
            />
            <Typography variant="body2">
              出貨量: {data.outQuantity}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }
  return null;
};

// InventoryStockChart props 型別
interface InventoryStockChartProps {
  transactions?: Transaction[];
  selectedOrderNumber?: string | null;
  onOrderSelect?: (orderNumber: string | null) => void;
}

const InventoryStockChart: FC<InventoryStockChartProps> = ({
  transactions = [],
  selectedOrderNumber = null,
  onOrderSelect
}) => {
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

  // 處理交易數據，獲取庫存變化數據
  const getStockChangeData = (): ChartDataItem[] => {
    // 防護檢查：確保transactions存在且是數組
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      console.warn('InventoryStockChart: transactions is undefined, null, or empty');
      return [];
    }
    
    // 按貨單號排序交易記錄（由小到大）
    const sortedTransactions = [...transactions].sort((a, b) => {
      const aOrderNumber = getOrderNumber(a);
      const bOrderNumber = getOrderNumber(b);
      return aOrderNumber.localeCompare(bOrderNumber);
    });
    
    return sortedTransactions.map((transaction, index) => {
      // 防護檢查：確保transaction存在且有必要的屬性
      if (!transaction) return null;
      
      const quantity = transaction.quantity ?? 0;
      const orderNumber = getOrderNumber(transaction);
      
      // 分離進貨和出貨量
      let inQuantity = 0;
      let outQuantity = 0;
      
      if (transaction.type === '進貨') {
        inQuantity = Math.abs(quantity);
      } else if (transaction.type === '銷售' || transaction.type === '出貨') {
        outQuantity = quantity; // 保持負值
      }
      
      return {
        orderNumber: orderNumber,
        index: index,
        type: transaction.type ?? '未知類型',
        quantity: quantity,
        price: transaction.price ?? 0,
        cumulativeStock: transaction.cumulativeStock ?? 0,
        inQuantity: inQuantity,
        outQuantity: outQuantity
      };
    }).filter((item): item is ChartDataItem => item !== null);
  };

  // 獲取處理後的圖表數據
  const chartData = getStockChangeData();

  // 計算共用Y軸的範圍
  const calculateSharedYAxisDomain = () => {
    if (chartData.length === 0) return [0, 100];
    
    // 獲取所有數值（庫存、進貨量、出貨量）
    const allValues: number[] = [];
    chartData.forEach(item => {
      allValues.push(item.cumulativeStock);
      if (item.inQuantity > 0) allValues.push(item.inQuantity);
      if (item.outQuantity < 0) allValues.push(item.outQuantity);
    });
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    // 添加一些緩衝空間
    const buffer = (maxValue - minValue) * 0.1;
    return [Math.floor(minValue - buffer), Math.ceil(maxValue + buffer)];
  };

  const sharedDomain = calculateSharedYAxisDomain();

  // 自定義點渲染函數
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isSelected = payload && payload.orderNumber === selectedOrderNumber;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 5 : 3}
        fill={isSelected ? colors.highlight : colors.stock}
        stroke={isSelected ? colors.highlight : colors.stock}
        strokeWidth={isSelected ? 2 : 1}
      />
    );
  };

  // 為面積圖準備數據
  const enhancedChartData = chartData.map((item) => {
    return {
      ...item,
      // 進出貨數據
      inQuantity: item.inQuantity,
      outQuantity: item.outQuantity
    };
  });

  // 渲染圖表
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            暫無庫存變化數據。
          </Alert>
          <Typography color="var(--text-secondary)">
            此商品沒有庫存記錄或數據未正確加載。
          </Typography>
        </Box>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={enhancedChartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barCategoryGap="20%"
          syncId="chartSync"
          onClick={(data) => {
            if (data && data.activePayload && data.activePayload[0]) {
              const clickedData = data.activePayload[0].payload;
              const orderNumber = clickedData.orderNumber;
              if (onOrderSelect) {
                onOrderSelect(selectedOrderNumber === orderNumber ? null : orderNumber);
              }
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="index"
            tick={false} // 不顯示刻度文字
            tickLine={false} // 不顯示刻度線
            axisLine={true} // 顯示軸線
          />
          {/* 共用Y軸 */}
          <YAxis
            label={{ value: '數量', angle: -90, position: 'insideLeft' }}
            domain={sharedDomain}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#000" />
          
          {/* 庫存折線圖 */}
          <Line
            type="monotone"
            dataKey="cumulativeStock"
            name="庫存數量"
            stroke={colors.stock}
            strokeWidth={selectedOrderNumber ? 3 : 2}
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: selectedOrderNumber ? colors.highlight : colors.stock }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight="600" color="var(--text-primary)" sx={{ mb: 1 }}>
        庫存變化圖表
      </Typography>
      
      {renderChart()}
    </Box>
  );
};

export default InventoryStockChart;